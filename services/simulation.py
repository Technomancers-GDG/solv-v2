from __future__ import annotations

import asyncio
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, time, timedelta
import hashlib
import heapq
from typing import Any

from fastapi import WebSocket
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from config import settings
from database import SessionLocal
from models import (
    DriverDecision,
    DriverProfile,
    Facility,
    MetricsSnapshot,
    NewsEvent,
    Objective,
    PortLink,
    Recommendation,
    RouteTemplate,
    SimEvent,
    Vehicle,
    WeatherEvent,
)
from schemas import DashboardSnapshot, FacilityLoadView, MetricsSummary, SimulationStatus, VehicleStateView
from services.route_planner import RoutePlanner


@dataclass(slots=True)
class LiveVehicleState:
    vehicle_id: int
    identifier: str
    status: str
    current_facility_id: int | None
    next_facility_id: int | None = None
    objective_id: int | None = None
    route_template_id: int | None = None
    route_distance_km: float = 0.0
    eta: datetime | None = None
    payload_units: int = 0
    progress_pct: float = 0.0
    duty_minutes_since_rest: float = 0.0
    last_recommendation_action: str | None = None
    stockout_risk_avoided: bool = False
    critical_payload: bool = False
    perishable_payload: bool = False


@dataclass(slots=True, order=True)
class ScheduledEvent:
    due_at: datetime
    priority: int
    sequence: int
    event_type: str = field(compare=False)
    vehicle_id: int = field(compare=False)
    objective_id: int | None = field(compare=False, default=None)
    payload: dict[str, Any] = field(compare=False, default_factory=dict)


@dataclass(slots=True)
class CandidateDecision:
    action: str
    destination_id: int | None
    score: float
    baseline_cost: float
    recommended_cost: float
    explanation: str
    breakdown: dict[str, float]
    travel_minutes: float
    route_risk: float
    eta_multiplier: float


class ConnectionManager:
    def __init__(self) -> None:
        self.connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.connections.discard(websocket)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        for websocket in list(self.connections):
            try:
                await websocket.send_json(payload)
            except Exception:
                self.disconnect(websocket)


class DecisionEngine:
    def effective_available_units(
        self,
        facility_id: int,
        facilities: dict[int, Facility],
        port_links: list[PortLink],
        inbound_reserved: dict[int, int],
    ) -> int:
        facility = facilities[facility_id]
        reserved_total = inbound_reserved.get(facility_id, 0)
        if facility.facility_type != "warehouse":
            return facility.base_capacity_units - facility.current_inventory_units - reserved_total

        linked_links = [link for link in port_links if link.warehouse_id == facility_id and link.active]
        static_reserved = sum(link.reserved_capacity_units for link in linked_links)
        dynamic_spillover = 0
        for link in linked_links:
            port = facilities[link.port_id]
            threshold_units = port.base_capacity_units * (link.spillover_threshold_pct / 100)
            port_pressure = max(0.0, port.current_inventory_units - threshold_units)
            dynamic_spillover += int(min(link.max_spillover_units, port_pressure))
        return (
            facility.base_capacity_units
            - facility.current_inventory_units
            - static_reserved
            - dynamic_spillover
            - reserved_total
        )

    def score_dispatch_options(
        self,
        *,
        sim_time: datetime,
        vehicle: Vehicle,
        objective: Objective,
        current_facility: Facility,
        facilities: dict[int, Facility],
        port_links: list[PortLink],
        inbound_reserved: dict[int, int],
        route_data: dict[int, RouteTemplate],
        risk_lookup: dict[int, dict[str, float]],
    ) -> CandidateDecision:
        original_destination_id = objective.destination_facility_id
        baseline_route = route_data[original_destination_id]
        baseline_risk = risk_lookup[original_destination_id]
        baseline_available = self.effective_available_units(
            original_destination_id, facilities, port_links, inbound_reserved
        )
        baseline_projected_units = baseline_available - vehicle.payload_capacity_units
        baseline_overload_risk = max(
            0.0,
            -baseline_projected_units / max(vehicle.payload_capacity_units, 1),
        )
        baseline_cost = self._total_cost(
            objective=objective,
            vehicle=vehicle,
            route=baseline_route,
            facility=facilities[original_destination_id],
            effective_available=baseline_available,
            risk=baseline_risk,
            original_duration=baseline_route.duration_minutes,
        )

        candidates: list[CandidateDecision] = []
        candidate_ids = [objective.destination_facility_id, *objective.fallback_facility_ids]
        for destination_id in candidate_ids:
            destination = facilities[destination_id]
            route = route_data[destination_id]
            risk = risk_lookup[destination_id]
            available_units = self.effective_available_units(
                destination_id, facilities, port_links, inbound_reserved
            )
            projected_units = available_units - vehicle.payload_capacity_units
            hard_blocked = (
                risk["route_risk"] >= 0.97
                or destination_id not in candidate_ids
                or destination.active is False
            )
            if hard_blocked:
                continue
            overload_risk = max(0.0, -projected_units / max(vehicle.payload_capacity_units, 1))
            if overload_risk > 0.75:
                continue

            action = "continue" if destination_id == objective.destination_facility_id else (
                "reroute_port" if destination.facility_type == "port" else "reroute_warehouse"
            )
            cost = self._total_cost(
                objective=objective,
                vehicle=vehicle,
                route=route,
                facility=destination,
                effective_available=available_units,
                risk=risk,
                original_duration=baseline_route.duration_minutes,
            )
            breakdown = {
                "overload_risk": round(overload_risk, 3),
                "added_travel_minutes": round(
                    max(0.0, route.duration_minutes * risk["eta_multiplier"] - baseline_route.duration_minutes), 2
                ),
                "predicted_idle_minutes": round(max(0.0, -projected_units) * 0.18, 2),
                "co2_delta_kg": round(
                    max(0.0, route.distance_km - baseline_route.distance_km) * vehicle.emission_kg_per_km, 2
                ),
                "sla_penalty": round(
                    max(
                        0.0,
                        route.duration_minutes * risk["eta_multiplier"]
                        + objective.loading_duration_minutes
                        + objective.unloading_duration_minutes
                        - objective.sla_minutes,
                    )
                    / max(objective.sla_minutes, 1),
                    3,
                ),
                "event_severity": round(risk["route_risk"], 3),
                "downstream_congestion": round(
                    facilities[destination_id].current_inventory_units
                    / max(facilities[destination_id].base_capacity_units, 1),
                    3,
                ),
                "baseline_overload_risk": round(baseline_overload_risk, 3),
                "baseline_event_severity": round(baseline_risk["route_risk"], 3),
            }
            explanation = self._explain(action, destination, breakdown, risk)
            candidates.append(
                CandidateDecision(
                    action=action,
                    destination_id=destination_id,
                    score=cost,
                    baseline_cost=baseline_cost,
                    recommended_cost=cost,
                    explanation=explanation,
                    breakdown=breakdown,
                    travel_minutes=route.duration_minutes,
                    route_risk=risk["route_risk"],
                    eta_multiplier=risk["eta_multiplier"],
                )
            )

        original_available = self.effective_available_units(
            original_destination_id, facilities, port_links, inbound_reserved
        )
        wait_minutes = max(
            40.0,
            (vehicle.payload_capacity_units - max(original_available, 0)) * 0.12
            + baseline_risk["route_risk"] * 60,
        )
        candidates.append(
            CandidateDecision(
                action="wait",
                destination_id=current_facility.id,
                score=baseline_cost + wait_minutes * 0.65,
                baseline_cost=baseline_cost,
                recommended_cost=baseline_cost + wait_minutes * 0.65,
                explanation=(
                    f"Wait at {current_facility.name} for {int(wait_minutes)} minutes to reduce "
                    f"destination overload and port spillover pressure."
                ),
                breakdown={
                    "overload_risk": round(max(0.0, -original_available / max(vehicle.payload_capacity_units, 1)), 3),
                    "added_travel_minutes": 0.0,
                    "predicted_idle_minutes": round(wait_minutes, 2),
                    "co2_delta_kg": 0.0,
                    "sla_penalty": round(wait_minutes / max(objective.sla_minutes, 1), 3),
                    "event_severity": round(baseline_risk["route_risk"], 3),
                    "downstream_congestion": round(
                        facilities[original_destination_id].current_inventory_units
                        / max(facilities[original_destination_id].base_capacity_units, 1),
                        3,
                    ),
                    "baseline_overload_risk": round(baseline_overload_risk, 3),
                    "baseline_event_severity": round(baseline_risk["route_risk"], 3),
                },
                travel_minutes=0.0,
                route_risk=baseline_risk["route_risk"],
                eta_multiplier=1.0,
            )
        )
        candidates.append(
            CandidateDecision(
                action="defer_dispatch",
                destination_id=current_facility.id,
                score=baseline_cost + objective.dispatch_interval_minutes * 0.82,
                baseline_cost=baseline_cost,
                recommended_cost=baseline_cost + objective.dispatch_interval_minutes * 0.82,
                explanation=(
                    "Defer this dispatch cycle and let downstream lanes clear before sending "
                    "another loaded vehicle."
                ),
                breakdown={
                    "overload_risk": 0.0,
                    "added_travel_minutes": 0.0,
                    "predicted_idle_minutes": float(objective.dispatch_interval_minutes),
                    "co2_delta_kg": 0.0,
                    "sla_penalty": round(objective.dispatch_interval_minutes / max(objective.sla_minutes, 1), 3),
                    "event_severity": round(baseline_risk["route_risk"], 3),
                    "downstream_congestion": 0.0,
                    "baseline_overload_risk": round(baseline_overload_risk, 3),
                    "baseline_event_severity": round(baseline_risk["route_risk"], 3),
                },
                travel_minutes=0.0,
                route_risk=baseline_risk["route_risk"],
                eta_multiplier=1.0,
            )
        )
        return min(candidates, key=lambda candidate: candidate.score)

    def _total_cost(
        self,
        *,
        objective: Objective,
        vehicle: Vehicle,
        route: RouteTemplate,
        facility: Facility,
        effective_available: int,
        risk: dict[str, float],
        original_duration: float,
    ) -> float:
        overload_penalty = max(0.0, vehicle.payload_capacity_units - max(effective_available, 0)) * 1.4
        added_travel = max(0.0, route.duration_minutes * risk["eta_multiplier"] - original_duration) * 0.42
        congestion_penalty = (
            facility.current_inventory_units / max(facility.base_capacity_units, 1)
        ) * 28
        co2_penalty = route.distance_km * vehicle.emission_kg_per_km * 0.18
        sla_penalty = max(
            0.0,
            route.duration_minutes * risk["eta_multiplier"]
            + objective.loading_duration_minutes
            + objective.unloading_duration_minutes
            - objective.sla_minutes,
        ) * 0.12
        event_penalty = risk["route_risk"] * 36
        return round(
            overload_penalty + added_travel + congestion_penalty + co2_penalty + sla_penalty + event_penalty,
            3,
        )

    def _explain(
        self,
        action: str,
        destination: Facility,
        breakdown: dict[str, float],
        risk: dict[str, float],
    ) -> str:
        if action == "continue":
            return (
                f"Continue to {destination.name}; capacity remains viable and combined weather/news "
                f"risk stays at {risk['route_risk']:.2f}."
            )
        return (
            f"{action.replace('_', ' ')} to {destination.name} because overload risk is "
            f"{breakdown['overload_risk']:.2f}, event severity is {breakdown['event_severity']:.2f}, "
            f"and downstream congestion is {breakdown['downstream_congestion']:.2f}."
        )


class SimulationEngine:
    def __init__(self, route_planner: RoutePlanner) -> None:
        self.route_planner = route_planner
        self.decision_engine = DecisionEngine()
        self.connection_manager = ConnectionManager()
        self.status = "idle"
        self.simulation_time = datetime.combine(
            settings.simulation_start_date, time(hour=8, minute=0)
        )
        self.speed_multiplier = settings.simulation_speed
        self.event_queue: list[ScheduledEvent] = []
        self._sequence = 0
        self._task: asyncio.Task[None] | None = None
        self.live_vehicle_states: dict[int, LiveVehicleState] = {}
        self.facilities: dict[int, Facility] = {}
        self.port_links: list[PortLink] = []
        self.objectives: dict[int, Objective] = {}
        self.vehicles: dict[int, Vehicle] = {}
        self.drivers: dict[int, DriverProfile] = {}
        self.routes: dict[str, RouteTemplate] = {}
        self.inbound_reserved: dict[int, int] = defaultdict(int)
        self.weather_map: dict[tuple[str, str], dict[str, float]] = {}
        self.news_map: dict[tuple[str, str], dict[str, Any]] = {}
        self.current_metrics = MetricsSummary(
            co2_saved_kg=0.0,
            idle_minutes_prevented=0.0,
            on_time_delivery_pct=100.0,
            warehouse_utilization_pct=0.0,
            reroute_count=0,
            active_trucks=0,
            queued_trucks=0,
            stockouts_prevented=0,
            critical_deliveries_saved=0,
            beneficiary_locations_served=0,
            spoilage_or_wastage_prevented=0,
        )
        self.completed_trips = 0
        self.on_time_trips = 0
        self.beneficiary_location_ids: set[int] = set()
        self.last_metrics_snapshot_hour: tuple[int, int, int, int] | None = None

    def queue_size(self) -> int:
        return len(self.event_queue)

    def snapshot_status(self) -> SimulationStatus:
        return SimulationStatus(
            status=self.status,
            simulation_time=self.simulation_time,
            speed_multiplier=self.speed_multiplier,
            queued_events=self.queue_size(),
        )

    def load_state(self, session: Session) -> None:
        self.facilities = {
            facility.id: facility for facility in session.scalars(select(Facility)).all()
        }
        self.port_links = session.scalars(select(PortLink)).all()
        self.objectives = {
            objective.id: objective for objective in session.scalars(select(Objective)).all()
        }
        self.vehicles = {vehicle.id: vehicle for vehicle in session.scalars(select(Vehicle)).all()}
        self.drivers = {
            driver.id: driver for driver in session.scalars(select(DriverProfile)).all()
        }
        self.live_vehicle_states = {
            vehicle.id: LiveVehicleState(
                vehicle_id=vehicle.id,
                identifier=vehicle.identifier,
                status=vehicle.status,
                current_facility_id=vehicle.current_facility_id or vehicle.home_facility_id,
                objective_id=vehicle.default_objective_id,
            )
            for vehicle in self.vehicles.values()
        }
        objective_destinations: list[tuple[int, list[int]]] = []
        for objective in self.objectives.values():
            destinations = [objective.destination_facility_id, *objective.fallback_facility_ids]
            objective_destinations.append((objective.origin_facility_id, destinations))
        self.route_planner.prewarm_objective_routes(session, self.facilities, objective_destinations)
        self.routes = {
            route.route_key: route for route in session.scalars(select(RouteTemplate)).all()
        }
        self._load_event_maps(session)

    def _load_event_maps(self, session: Session) -> None:
        self.weather_map.clear()
        self.news_map.clear()
        for weather in session.scalars(select(WeatherEvent)).all():
            self.weather_map[(weather.simulation_date.isoformat(), weather.city)] = {
                "closure_risk": weather.closure_risk,
                "eta_multiplier": weather.eta_multiplier,
                "precipitation_mm": weather.precipitation_mm,
            }
        for news in session.scalars(select(NewsEvent).where(NewsEvent.relevant.is_(True))).all():
            key = (news.simulation_date.isoformat(), news.city)
            existing = self.news_map.get(key)
            if existing is None or news.impact_score > existing["impact_score"]:
                self.news_map[key] = {
                    "impact_score": news.impact_score,
                    "impact_type": news.impact_type,
                    "headline": news.headline,
                    "category": news.category,
                }

    def _schedule(
        self,
        due_at: datetime,
        event_type: str,
        vehicle_id: int,
        objective_id: int | None,
        payload: dict[str, Any] | None = None,
        priority: int = 1,
    ) -> None:
        self._sequence += 1
        heapq.heappush(
            self.event_queue,
            ScheduledEvent(
                due_at=due_at,
                priority=priority,
                sequence=self._sequence,
                event_type=event_type,
                vehicle_id=vehicle_id,
                objective_id=objective_id,
                payload=payload or {},
            ),
        )

    def seed_dispatch_queue(self) -> None:
        self.event_queue.clear()
        self.inbound_reserved = defaultdict(int)
        stagger = 0
        for objective in self.objectives.values():
            for vehicle_id in objective.assigned_vehicle_ids:
                if vehicle_id not in self.vehicles:
                    continue
                self._schedule(
                    self.simulation_time + timedelta(minutes=stagger),
                    "dispatch",
                    vehicle_id=vehicle_id,
                    objective_id=objective.id,
                    payload={"leg": "outbound"},
                    priority=1,
                )
                stagger += 6

    async def start(self, speed_multiplier: float | None = None) -> SimulationStatus:
        if self.status == "running":
            return self.snapshot_status()
        if speed_multiplier is not None:
            self.speed_multiplier = speed_multiplier
        with SessionLocal() as session:
            self.load_state(session)
        self.simulation_time = datetime.combine(
            settings.simulation_start_date, time(hour=8, minute=0)
        )
        self.current_metrics = MetricsSummary(
            co2_saved_kg=0.0,
            idle_minutes_prevented=0.0,
            on_time_delivery_pct=100.0,
            warehouse_utilization_pct=0.0,
            reroute_count=0,
            active_trucks=0,
            queued_trucks=0,
            stockouts_prevented=0,
            critical_deliveries_saved=0,
            beneficiary_locations_served=0,
            spoilage_or_wastage_prevented=0,
        )
        self.completed_trips = 0
        self.on_time_trips = 0
        self.beneficiary_location_ids.clear()
        self.seed_dispatch_queue()
        self.status = "running"
        self._task = asyncio.create_task(self._run_loop())
        return self.snapshot_status()

    async def pause(self) -> SimulationStatus:
        self.status = "paused"
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        return self.snapshot_status()

    async def resume(self) -> SimulationStatus:
        if self.status == "running":
            return self.snapshot_status()
        self.status = "running"
        self._task = asyncio.create_task(self._run_loop())
        return self.snapshot_status()

    async def reset(self) -> SimulationStatus:
        await self.pause()
        with SessionLocal() as session:
            session.execute(delete(Recommendation))
            session.execute(delete(DriverDecision))
            session.execute(delete(SimEvent))
            session.execute(delete(MetricsSnapshot))
            for facility in session.scalars(select(Facility)).all():
                facility.current_inventory_units = facility.initial_inventory_units
            for vehicle in session.scalars(select(Vehicle)).all():
                vehicle.current_facility_id = vehicle.home_facility_id
                vehicle.status = "idle"
                vehicle.available_at = None
            for driver in session.scalars(select(DriverProfile)).all():
                driver.override_rating = max(driver.override_rating, 1.0)
            session.commit()
            self.load_state(session)
        self.simulation_time = datetime.combine(
            settings.simulation_start_date, time(hour=8, minute=0)
        )
        self.seed_dispatch_queue()
        self.beneficiary_location_ids.clear()
        self.status = "idle"
        return self.snapshot_status()

    async def _run_loop(self) -> None:
        loop = asyncio.get_running_loop()
        last_wall = loop.time()
        while self.status == "running":
            await asyncio.sleep(0.2)
            current_wall = loop.time()
            wall_delta = current_wall - last_wall
            last_wall = current_wall
            self.simulation_time += timedelta(seconds=wall_delta * self.speed_multiplier)
            processed = 0
            with SessionLocal() as session:
                while self.event_queue and self.event_queue[0].due_at <= self.simulation_time and processed < 80:
                    event = heapq.heappop(self.event_queue)
                    self._process_event(session, event)
                    processed += 1
                if processed:
                    session.commit()
                    await self._maybe_snapshot(session)
                    await self.connection_manager.broadcast(
                        {"type": "simulation_snapshot", "payload": self.dashboard_snapshot(session).model_dump(mode="json")}
                    )

    def _process_event(self, session: Session, event: ScheduledEvent) -> None:
        if event.event_type == "dispatch":
            self._handle_dispatch(session, event)
        elif event.event_type == "load_complete":
            self._handle_load_complete(session, event)
        elif event.event_type == "arrive":
            self._handle_arrival(session, event)
        elif event.event_type == "unload_complete":
            self._handle_unload_complete(session, event)
        elif event.event_type == "rest_complete":
            self._handle_rest_complete(session, event)

        session.add(
            SimEvent(
                scheduled_time=event.due_at,
                processed_time=self.simulation_time,
                event_type=event.event_type,
                vehicle_id=event.vehicle_id,
                objective_id=event.objective_id,
                facility_id=event.payload.get("facility_id"),
                payload=event.payload,
            )
        )

    def _handle_dispatch(self, session: Session, event: ScheduledEvent) -> None:
        vehicle = self.vehicles[event.vehicle_id]
        state = self.live_vehicle_states[event.vehicle_id]
        objective = self.objectives[event.objective_id] if event.objective_id else None
        if objective is None:
            return
        current_facility = self.facilities[state.current_facility_id or objective.origin_facility_id]
        leg = event.payload.get("leg", "outbound")
        state.stockout_risk_avoided = False
        if leg == "outbound":
            state.critical_payload = self._is_critical_objective(objective)
            state.perishable_payload = self._is_perishable_objective(objective)

        if state.duty_minutes_since_rest >= vehicle.rest_every_hours * 60:
            state.status = "resting"
            self._schedule(
                self.simulation_time + timedelta(minutes=vehicle.rest_duration_minutes),
                "rest_complete",
                vehicle_id=vehicle.id,
                objective_id=objective.id,
                payload={"leg": leg, "facility_id": current_facility.id},
            )
            return

        if leg == "return":
            state.critical_payload = False
            state.perishable_payload = False
            route = self.route_planner.get_or_create_template(
                session, current_facility, self.facilities[objective.origin_facility_id]
            )
            eta = self.simulation_time + timedelta(minutes=route.duration_minutes)
            state.status = "in_transit"
            state.current_facility_id = None
            state.next_facility_id = objective.origin_facility_id
            state.route_template_id = route.id
            state.route_distance_km = route.distance_km
            state.eta = eta
            state.progress_pct = 0.0
            state.payload_units = 0
            state.duty_minutes_since_rest += route.duration_minutes
            vehicle.status = "in_transit"
            vehicle.current_facility_id = None
            vehicle.available_at = eta
            self._schedule(
                eta,
                "arrive",
                vehicle_id=vehicle.id,
                objective_id=objective.id,
                payload={
                    "leg": "return",
                    "destination_id": objective.origin_facility_id,
                    "facility_id": objective.origin_facility_id,
                    "route_id": route.id,
                },
            )
            return

        route_data = {}
        risk_lookup = {}
        destination_ids = [objective.destination_facility_id, *objective.fallback_facility_ids]
        for destination_id in destination_ids:
            destination = self.facilities[destination_id]
            route = self.route_planner.get_or_create_template(session, current_facility, destination)
            route_data[destination_id] = route
            risk_lookup[destination_id] = self._route_risk(current_facility.city, destination.city)
        decision = self.decision_engine.score_dispatch_options(
            sim_time=self.simulation_time,
            vehicle=vehicle,
            objective=objective,
            current_facility=current_facility,
            facilities=self.facilities,
            port_links=self.port_links,
            inbound_reserved=self.inbound_reserved,
            route_data=route_data,
            risk_lookup=risk_lookup,
        )
        state.last_recommendation_action = decision.action
        chosen_decision = decision
        if decision.action != "continue":
            chosen_decision = self._apply_driver_override(session, vehicle, objective, decision, current_facility)

        state.stockout_risk_avoided = (
            chosen_decision.action.startswith("reroute")
            and (
                chosen_decision.breakdown.get("baseline_overload_risk", 0.0) >= 0.25
                or chosen_decision.breakdown.get("baseline_event_severity", 0.0) >= 0.6
            )
        )

        if chosen_decision.action == "wait":
            state.status = "waiting"
            vehicle.status = "waiting"
            wait_minutes = max(15, int(chosen_decision.breakdown["predicted_idle_minutes"]))
            vehicle.available_at = self.simulation_time + timedelta(minutes=wait_minutes)
            self._schedule(
                self.simulation_time + timedelta(minutes=wait_minutes),
                "dispatch",
                vehicle_id=vehicle.id,
                objective_id=objective.id,
                payload={"leg": "outbound", "facility_id": current_facility.id},
                priority=2,
            )
            return
        if chosen_decision.action == "defer_dispatch":
            state.status = "queued"
            vehicle.status = "queued"
            defer_minutes = objective.dispatch_interval_minutes
            vehicle.available_at = self.simulation_time + timedelta(minutes=defer_minutes)
            self._schedule(
                self.simulation_time + timedelta(minutes=defer_minutes),
                "dispatch",
                vehicle_id=vehicle.id,
                objective_id=objective.id,
                payload={"leg": "outbound", "facility_id": current_facility.id},
                priority=3,
            )
            return

        route = route_data[chosen_decision.destination_id]
        state.status = "loading"
        state.objective_id = objective.id
        state.payload_units = vehicle.payload_capacity_units
        state.route_template_id = route.id
        state.route_distance_km = route.distance_km
        vehicle.status = "loading"
        vehicle.current_facility_id = current_facility.id
        load_complete_time = self.simulation_time + timedelta(
            minutes=objective.loading_duration_minutes
        )
        self._schedule(
            load_complete_time,
            "load_complete",
            vehicle_id=vehicle.id,
            objective_id=objective.id,
            payload={
                "leg": "outbound",
                "destination_id": chosen_decision.destination_id,
                "facility_id": current_facility.id,
                "route_id": route.id,
                "eta_multiplier": chosen_decision.eta_multiplier,
            },
        )

    def _handle_load_complete(self, session: Session, event: ScheduledEvent) -> None:
        vehicle = self.vehicles[event.vehicle_id]
        state = self.live_vehicle_states[event.vehicle_id]
        objective = self.objectives[event.objective_id]
        destination_id = event.payload["destination_id"]
        route = self.routes.get(
            self.route_planner.route_key(event.payload["facility_id"], destination_id)
        ) or session.get(RouteTemplate, event.payload["route_id"])
        self.routes[route.route_key] = route
        travel_minutes = route.duration_minutes * float(event.payload.get("eta_multiplier", 1.0))
        eta = self.simulation_time + timedelta(minutes=travel_minutes)
        self.inbound_reserved[destination_id] += vehicle.payload_capacity_units
        state.status = "in_transit"
        state.current_facility_id = None
        state.next_facility_id = destination_id
        state.eta = eta
        state.progress_pct = 0.0
        state.duty_minutes_since_rest += objective.loading_duration_minutes + travel_minutes
        vehicle.status = "in_transit"
        vehicle.current_facility_id = None
        vehicle.available_at = eta
        self._schedule(
            eta,
            "arrive",
            vehicle_id=vehicle.id,
            objective_id=objective.id,
            payload={
                "leg": "outbound",
                "destination_id": destination_id,
                "facility_id": destination_id,
                "route_id": route.id,
            },
        )

    def _handle_arrival(self, session: Session, event: ScheduledEvent) -> None:
        vehicle = self.vehicles[event.vehicle_id]
        state = self.live_vehicle_states[event.vehicle_id]
        objective = self.objectives[event.objective_id]
        destination_id = event.payload["destination_id"]
        destination = self.facilities[destination_id]
        state.current_facility_id = destination_id
        state.next_facility_id = None
        state.eta = None
        state.progress_pct = 100.0
        vehicle.current_facility_id = destination_id
        if event.payload.get("leg") == "return":
            state.status = "idle"
            state.payload_units = 0
            state.route_template_id = None
            vehicle.status = "idle"
            next_due = self.simulation_time + timedelta(minutes=objective.dispatch_interval_minutes)
            vehicle.available_at = next_due
            self._schedule(
                next_due,
                "dispatch",
                vehicle_id=vehicle.id,
                objective_id=objective.id,
                payload={"leg": "outbound", "facility_id": destination_id},
            )
            return

        state.status = "unloading"
        vehicle.status = "unloading"
        unload_complete_time = self.simulation_time + timedelta(
            minutes=objective.unloading_duration_minutes
        )
        vehicle.available_at = unload_complete_time
        self._schedule(
            unload_complete_time,
            "unload_complete",
            vehicle_id=vehicle.id,
            objective_id=objective.id,
            payload={"destination_id": destination_id, "facility_id": destination_id},
        )

    def _handle_unload_complete(self, session: Session, event: ScheduledEvent) -> None:
        vehicle = self.vehicles[event.vehicle_id]
        state = self.live_vehicle_states[event.vehicle_id]
        objective = self.objectives[event.objective_id]
        destination = self.facilities[event.payload["destination_id"]]
        destination.current_inventory_units += vehicle.payload_capacity_units
        self.inbound_reserved[destination.id] -= vehicle.payload_capacity_units
        state.payload_units = 0
        state.status = "queued_return"
        vehicle.status = "queued_return"

        self.completed_trips += 1
        trip_minutes = self._estimate_trip_minutes(objective)
        arrived_on_time = trip_minutes <= objective.sla_minutes
        if arrived_on_time:
            self.on_time_trips += 1
        self.current_metrics.on_time_delivery_pct = round(
            (self.on_time_trips / max(self.completed_trips, 1)) * 100, 2
        )
        if state.stockout_risk_avoided:
            self.current_metrics.stockouts_prevented += 1
        if state.critical_payload:
            if arrived_on_time:
                self.current_metrics.critical_deliveries_saved += 1
            self.beneficiary_location_ids.add(destination.id)
            self.current_metrics.beneficiary_locations_served = len(self.beneficiary_location_ids)
        if state.perishable_payload and (state.stockout_risk_avoided or arrived_on_time):
            self.current_metrics.spoilage_or_wastage_prevented += vehicle.payload_capacity_units
        state.stockout_risk_avoided = False
        state.critical_payload = False
        state.perishable_payload = False
        next_due = self.simulation_time + timedelta(minutes=12)
        vehicle.available_at = next_due
        self._schedule(
            next_due,
            "dispatch",
            vehicle_id=vehicle.id,
            objective_id=objective.id,
            payload={"leg": "return", "facility_id": destination.id},
            priority=2,
        )

    def _handle_rest_complete(self, session: Session, event: ScheduledEvent) -> None:
        vehicle = self.vehicles[event.vehicle_id]
        state = self.live_vehicle_states[event.vehicle_id]
        state.status = "idle"
        state.duty_minutes_since_rest = 0
        vehicle.status = "idle"
        vehicle.available_at = self.simulation_time
        self._schedule(
            self.simulation_time + timedelta(minutes=1),
            "dispatch",
            vehicle_id=vehicle.id,
            objective_id=event.objective_id,
            payload={"leg": event.payload.get("leg", "outbound"), "facility_id": event.payload.get("facility_id")},
            priority=1,
        )

    def _apply_driver_override(
        self,
        session: Session,
        vehicle: Vehicle,
        objective: Objective,
        decision: CandidateDecision,
        current_facility: Facility,
    ) -> CandidateDecision:
        recommendation = Recommendation(
            simulation_time=self.simulation_time,
            vehicle_id=vehicle.id,
            objective_id=objective.id,
            current_facility_id=current_facility.id,
            original_destination_id=objective.destination_facility_id,
            recommended_destination_id=decision.destination_id,
            action=decision.action,
            explanation=decision.explanation,
            score_breakdown=decision.breakdown,
            baseline_cost=decision.baseline_cost,
            recommended_cost=decision.recommended_cost,
            status="suggested",
        )
        session.add(recommendation)
        session.flush()

        driver = self.drivers[vehicle.driver_profile_id]
        decision_seed = self._stable_random_value(
            f"{vehicle.id}:{objective.id}:{self.simulation_time.isoformat()}:{decision.action}"
        )
        accept_score = (
            0.46
            + driver.accept_recommendation_bias * 0.24
            - driver.confidence * 0.14
            - max(0.0, driver.override_rating - 1.0) * 0.08
        )
        accepted = decision_seed <= accept_score
        if accepted:
            recommendation.status = "accepted"
            note = "Driver accepted the AI recommendation."
            actual_trip_cost = decision.recommended_cost
            rating_delta = 0.0
            final_decision = decision
        else:
            recommendation.status = "ignored"
            actual_trip_cost = decision.baseline_cost
            within_tolerance = actual_trip_cost <= decision.recommended_cost * 1.05
            rating_delta = 0.08 if within_tolerance else -0.12
            driver.override_rating = round(max(0.2, driver.override_rating + rating_delta), 3)
            note = (
                "Driver ignored the reroute suggestion; rating updated from actual trip versus "
                "recommended trip cost."
            )
            self.current_metrics.co2_saved_kg += max(
                0.0, decision.baseline_cost - decision.recommended_cost
            ) * 0.05
            self.current_metrics.idle_minutes_prevented += max(
                0.0,
                decision.breakdown.get("predicted_idle_minutes", 0.0)
                - (15.0 if within_tolerance else 0.0),
            )
            final_decision = CandidateDecision(
                action="continue",
                destination_id=objective.destination_facility_id,
                score=decision.baseline_cost,
                baseline_cost=decision.baseline_cost,
                recommended_cost=decision.baseline_cost,
                explanation="Driver overrode the recommendation and continued on the original objective route.",
                breakdown=decision.breakdown,
                travel_minutes=decision.travel_minutes,
                route_risk=decision.route_risk,
                eta_multiplier=1.0,
            )

        session.add(
            DriverDecision(
                recommendation_id=recommendation.id,
                driver_profile_id=driver.id,
                vehicle_id=vehicle.id,
                decision="accepted" if accepted else "ignored",
                actual_trip_cost=round(actual_trip_cost, 3),
                recommended_trip_cost=round(decision.recommended_cost, 3),
                rating_delta=rating_delta,
                note=note,
            )
        )
        if decision.action.startswith("reroute"):
            self.current_metrics.reroute_count += 1
            self.current_metrics.co2_saved_kg += max(
                0.0, decision.baseline_cost - decision.recommended_cost
            ) * 0.05
            self.current_metrics.idle_minutes_prevented += max(
                0.0, decision.breakdown.get("predicted_idle_minutes", 0.0) - 8.0
            )
        return final_decision

    def _stable_random_value(self, key: str) -> float:
        digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
        return int(digest[:8], 16) / 0xFFFFFFFF

    def _route_risk(self, origin_city: str, destination_city: str) -> dict[str, float]:
        sim_key = self.simulation_time.date().isoformat()
        weather_eta = 1.0
        closure_risk = 0.0
        active_events: list[str] = []
        for city in {origin_city, destination_city}:
            weather = self.weather_map.get((sim_key, city))
            if weather:
                weather_eta = max(weather_eta, weather["eta_multiplier"])
                closure_risk = max(closure_risk, weather["closure_risk"])
            news = self.news_map.get((sim_key, city))
            if news:
                active_events.append(news["headline"])
                closure_risk = max(closure_risk, news["impact_score"])
                weather_eta = max(weather_eta, 1.0 + news["impact_score"] * 0.22)
        return {
            "route_risk": round(min(0.99, closure_risk), 3),
            "eta_multiplier": round(weather_eta, 3),
            "active_event_count": float(len(active_events)),
        }

    def _estimate_trip_minutes(self, objective: Objective) -> float:
        route = self.routes.get(
            self.route_planner.route_key(objective.origin_facility_id, objective.destination_facility_id)
        )
        duration = route.duration_minutes if route else 0.0
        return duration + objective.loading_duration_minutes + objective.unloading_duration_minutes

    def _is_critical_objective(self, objective: Objective) -> bool:
        text = f"{objective.name} {objective.commodity}".lower()
        critical_terms = (
            "medicine",
            "vaccine",
            "oxygen",
            "blood",
            "relief",
            "food",
            "grain",
            "nutrition",
            "essential",
        )
        return objective.priority >= 3 or any(term in text for term in critical_terms)

    def _is_perishable_objective(self, objective: Objective) -> bool:
        text = f"{objective.name} {objective.commodity}".lower()
        perishable_terms = (
            "vaccine",
            "insulin",
            "blood",
            "medicine",
            "food",
            "grain",
            "nutrition",
        )
        return any(term in text for term in perishable_terms)

    def compare_scenario(self, session: Session, scenario: Any) -> dict[str, Any]:
        if not self.objectives or not self.facilities or not self.vehicles:
            self.load_state(session)
        active_objectives = [objective for objective in self.objectives.values() if objective.active]
        if not active_objectives or not self.vehicles:
            empty = {
                "on_time_delivery_pct": 0.0,
                "average_delay_minutes": 0.0,
                "overflow_events": 0,
                "reroute_count": 0,
                "idle_minutes_prevented": 0.0,
                "co2_saved_kg": 0.0,
                "stockouts_prevented": 0,
            }
            return {
                "baseline": empty,
                "ai": empty,
                "improvement": {
                    "on_time_delta_pct": 0.0,
                    "delay_reduction_minutes": 0.0,
                    "overflow_reduction": 0.0,
                    "stockout_delta": 0.0,
                },
            }

        baseline_delays: list[float] = []
        ai_delays: list[float] = []
        baseline_on_time = 0
        ai_on_time = 0
        baseline_overflow = 0
        ai_overflow = 0
        ai_reroutes = 0
        ai_idle_saved = 0.0
        ai_co2_saved = 0.0
        ai_stockouts_prevented = 0
        fallback_vehicle = next(iter(self.vehicles.values()))
        scenario_city = str(getattr(scenario, "event_city", "")).lower()
        scenario_eta_multiplier = max(1.0, float(getattr(scenario, "eta_multiplier", 1.2)))
        scenario_severity = min(0.99, max(0.0, float(getattr(scenario, "severity", 0.6))))
        inventory_pressure_pct = max(0.0, float(getattr(scenario, "inventory_pressure_pct", 0.0)))

        for objective in active_objectives:
            origin = self.facilities.get(objective.origin_facility_id)
            destination = self.facilities.get(objective.destination_facility_id)
            if origin is None or destination is None:
                continue

            route = self.route_planner.get_or_create_template(session, origin, destination)
            self.routes[route.route_key] = route
            first_vehicle_id = objective.assigned_vehicle_ids[0] if objective.assigned_vehicle_ids else fallback_vehicle.id
            vehicle = self.vehicles.get(first_vehicle_id, fallback_vehicle)
            payload_units = vehicle.payload_capacity_units

            base_trip_minutes = (
                route.duration_minutes
                + objective.loading_duration_minutes
                + objective.unloading_duration_minutes
            )
            disrupted_leg = (
                origin.city.lower() == scenario_city or destination.city.lower() == scenario_city
            )
            multiplier = scenario_eta_multiplier if disrupted_leg else (1.0 + scenario_severity * 0.12)
            baseline_trip_minutes = base_trip_minutes * multiplier

            pressure_units = int(destination.base_capacity_units * (inventory_pressure_pct / 100))
            projected_inventory = destination.current_inventory_units + payload_units + pressure_units
            baseline_overflow_risk = max(
                0.0,
                (projected_inventory - destination.base_capacity_units) / max(payload_units, 1),
            )
            baseline_delay = max(0.0, baseline_trip_minutes - objective.sla_minutes)
            baseline_delays.append(baseline_delay)
            if baseline_trip_minutes <= objective.sla_minutes:
                baseline_on_time += 1
            if baseline_overflow_risk > 0.0:
                baseline_overflow += 1

            critical = self._is_critical_objective(objective)
            baseline_stockout = baseline_overflow_risk > 0.2 or (
                critical and baseline_delay > objective.sla_minutes * 0.1
            )

            ai_trip_minutes = baseline_trip_minutes
            ai_overflow_risk = baseline_overflow_risk
            rerouted = False
            if objective.fallback_facility_ids and (
                baseline_overflow_risk > 0.05 or baseline_delay > 0.0 or disrupted_leg
            ):
                rerouted = True
                ai_reroutes += 1
                ai_trip_minutes = baseline_trip_minutes * (0.72 if critical else 0.78)
                ai_overflow_risk = max(0.0, baseline_overflow_risk - 0.55)

            ai_delay = max(0.0, ai_trip_minutes - objective.sla_minutes)
            ai_delays.append(ai_delay)
            if ai_trip_minutes <= objective.sla_minutes:
                ai_on_time += 1
            if ai_overflow_risk > 0.0:
                ai_overflow += 1

            ai_idle_saved += max(0.0, baseline_delay - ai_delay) * 0.5
            ai_co2_saved += max(0.0, baseline_delay - ai_delay) * 0.14
            if baseline_stockout and (rerouted or ai_delay < baseline_delay * 0.75):
                ai_stockouts_prevented += 1

        total = max(len(active_objectives), 1)
        baseline_metrics = {
            "on_time_delivery_pct": round((baseline_on_time / total) * 100, 2),
            "average_delay_minutes": round(sum(baseline_delays) / max(len(baseline_delays), 1), 2),
            "overflow_events": baseline_overflow,
            "reroute_count": 0,
            "idle_minutes_prevented": 0.0,
            "co2_saved_kg": 0.0,
            "stockouts_prevented": 0,
        }
        ai_metrics = {
            "on_time_delivery_pct": round((ai_on_time / total) * 100, 2),
            "average_delay_minutes": round(sum(ai_delays) / max(len(ai_delays), 1), 2),
            "overflow_events": ai_overflow,
            "reroute_count": ai_reroutes,
            "idle_minutes_prevented": round(ai_idle_saved, 2),
            "co2_saved_kg": round(ai_co2_saved, 2),
            "stockouts_prevented": ai_stockouts_prevented,
        }
        return {
            "baseline": baseline_metrics,
            "ai": ai_metrics,
            "improvement": {
                "on_time_delta_pct": round(
                    ai_metrics["on_time_delivery_pct"] - baseline_metrics["on_time_delivery_pct"],
                    2,
                ),
                "delay_reduction_minutes": round(
                    baseline_metrics["average_delay_minutes"] - ai_metrics["average_delay_minutes"],
                    2,
                ),
                "overflow_reduction": round(
                    baseline_metrics["overflow_events"] - ai_metrics["overflow_events"],
                    2,
                ),
                "stockout_delta": round(ai_metrics["stockouts_prevented"], 2),
            },
        }

    async def _maybe_snapshot(self, session: Session) -> None:
        warehouse_facilities = [
            facility for facility in self.facilities.values() if facility.facility_type == "warehouse"
        ]
        if warehouse_facilities:
            utilization = sum(
                facility.current_inventory_units / max(facility.base_capacity_units, 1)
                for facility in warehouse_facilities
            ) / len(warehouse_facilities)
            self.current_metrics.warehouse_utilization_pct = round(utilization * 100, 2)
        self.current_metrics.active_trucks = sum(
            1 for state in self.live_vehicle_states.values() if state.status == "in_transit"
        )
        self.current_metrics.queued_trucks = sum(
            1 for state in self.live_vehicle_states.values() if state.status in {"waiting", "queued"}
        )

        current_hour = (
            self.simulation_time.year,
            self.simulation_time.month,
            self.simulation_time.day,
            self.simulation_time.hour,
        )
        if current_hour == self.last_metrics_snapshot_hour:
            return
        self.last_metrics_snapshot_hour = current_hour
        session.add(
            MetricsSnapshot(
                captured_at=self.simulation_time,
                co2_saved_kg=self.current_metrics.co2_saved_kg,
                idle_minutes_prevented=self.current_metrics.idle_minutes_prevented,
                on_time_delivery_pct=self.current_metrics.on_time_delivery_pct,
                warehouse_utilization_pct=self.current_metrics.warehouse_utilization_pct,
                reroute_count=self.current_metrics.reroute_count,
                active_trucks=self.current_metrics.active_trucks,
                queued_trucks=self.current_metrics.queued_trucks,
            )
        )

    def dashboard_snapshot(self, session: Session) -> DashboardSnapshot:
        recent_alerts = session.scalars(
            select(Recommendation).order_by(Recommendation.created_at.desc()).limit(8)
        ).all()
        active_events = self._active_event_feed()
        facility_views = [
            FacilityLoadView(
                facility_id=facility.id,
                facility_name=facility.name,
                facility_type=facility.facility_type,
                city=facility.city,
                utilization_pct=round(
                    facility.current_inventory_units / max(facility.base_capacity_units, 1) * 100, 2
                ),
                effective_available_units=self.decision_engine.effective_available_units(
                    facility.id, self.facilities, self.port_links, self.inbound_reserved
                ),
                queue_capacity_units=facility.queue_capacity_units,
                current_inventory_units=facility.current_inventory_units,
            )
            for facility in self.facilities.values()
        ]
        vehicle_views = []
        for state in self.live_vehicle_states.values():
            vehicle_views.append(
                VehicleStateView(
                    vehicle_id=state.vehicle_id,
                    identifier=state.identifier,
                    status=state.status,
                    objective_id=state.objective_id,
                    current_facility_id=state.current_facility_id,
                    next_facility_id=state.next_facility_id,
                    progress_pct=self._progress_for_state(state),
                    eta=state.eta,
                    payload_units=state.payload_units,
                    recommendation_action=state.last_recommendation_action,
                )
            )
        return DashboardSnapshot(
            simulation=self.snapshot_status(),
            facilities=sorted(facility_views, key=lambda item: item.utilization_pct, reverse=True),
            vehicles=vehicle_views,
            alerts=recent_alerts,
            metrics=self.current_metrics,
            active_events=active_events,
        )

    def _progress_for_state(self, state: LiveVehicleState) -> float:
        if state.status != "in_transit" or state.eta is None:
            return state.progress_pct
        remaining = max((state.eta - self.simulation_time).total_seconds(), 0.0)
        if remaining == 0:
            return 100.0
        total_seconds = max(state.route_distance_km / 48 * 3600, 1.0)
        return round(max(0.0, min(100.0, (1 - remaining / total_seconds) * 100)), 2)

    def _active_event_feed(self) -> list[dict[str, Any]]:
        sim_key = self.simulation_time.date().isoformat()
        entries: list[dict[str, Any]] = []
        for city in {facility.city for facility in self.facilities.values()}:
            weather = self.weather_map.get((sim_key, city))
            news = self.news_map.get((sim_key, city))
            if news:
                entries.append(
                    {
                        "city": city,
                        "kind": "news",
                        "headline": news["headline"],
                        "impact_score": news["impact_score"],
                        "impact_type": news["impact_type"],
                    }
                )
            if weather and weather["closure_risk"] >= 0.2:
                entries.append(
                    {
                        "city": city,
                        "kind": "weather",
                        "headline": f"Weather pressure in {city}",
                        "impact_score": weather["closure_risk"],
                        "impact_type": "weather_disruption",
                    }
                )
        entries.sort(key=lambda item: item["impact_score"], reverse=True)
        return entries[:10]
