from __future__ import annotations

import asyncio
from math import ceil
from pathlib import Path
from typing import Any, TypeVar

from fastapi import Depends, FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from database import SessionLocal, get_session, init_db
from models import (
    DriverDecision,
    DriverIncident,
    DriverProfile,
    Facility,
    MetricsSnapshot,
    NewsEvent,
    Objective,
    PortLink,
    Recommendation,
    RouteTemplate,
    ScenarioPreset,
    Vehicle,
    WeatherEvent,
)
from schemas import (
    BlockchainBlockRead,
    BlockchainVerifyRead,
    CloudHealthRead,
    DashboardSnapshot,
    DriverDecisionRead,
    DriverIncidentCreate,
    DriverIncidentRead,
    DriverInstructionRead,
    DriverMobileSnapshot,
    DriverResponseRequest,
    DriverProfileCreate,
    DriverProfileRead,
    EdgeSyncStatusRead,
    FacilityCreate,
    FacilityRead,
    FacilityUpdate,
    FleetScaleRequest,
    FleetScaleResult,
    ImportSummary,
    InventoryForecastRead,
    MetricsSummary,
    ObjectiveCreate,
    ObjectiveRead,
    ObjectiveUpdate,
    ParetoFrontRead,
    PortLinkCreate,
    PortLinkRead,
    ProactiveDispatchRead,
    RecommendationDecisionRequest,
    RecommendationRead,
    RLDecisionRequest,
    RLDecisionResponse,
    RiskForecastRead,
    RouteTemplateRead,
    ScenarioComparisonMetrics,
    ScenarioComparisonRead,
    ScenarioPresetRead,
    SimulationControlRequest,
    SimulationStatus,
    VehicleCreate,
    VehicleRead,
    VehicleUpdate,
    WeatherEventRead,
    NewsEventRead,
)
from seed_data import seed_demo_data
from services.blockchain_audit import AuditBlock, get_ledger
from services.edge_sync import get_edge_sync_manager
from services.event_ingestion import EventIngestionService
from services.google_cloud_integration import get_gcp_integration
from services.inventory_optimizer import InventoryOptimizer
from services.multi_objective_optimizer import NSGA2Optimizer
from services.news_relevance import NewsRelevanceService
from services.predictive_forecast import PredictiveForecastService
from services.rl_decision_engine import get_rl_engine, StateVector
from services.route_planner import RoutePlanner
from services.simulation import SimulationEngine


app = FastAPI(title=settings.app_name, version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

news_model = NewsRelevanceService()
route_planner = RoutePlanner()
event_ingestion_service = EventIngestionService(news_model)
simulation_engine = SimulationEngine(route_planner)
forecast_service = PredictiveForecastService()
inventory_optimizer = InventoryOptimizer()
demo_disruption_task: asyncio.Task[None] | None = None

ModelType = TypeVar("ModelType")


def apply_updates(instance: ModelType, updates: dict[str, Any]) -> ModelType:
    for field_name, value in updates.items():
        setattr(instance, field_name, value)
    return instance


def normalize_incident_impact_type(incident_type: str) -> str:
    mapping = {
        "road_blockage": "road_blockage",
        "blockage": "road_blockage",
        "strike": "labor_disruption",
        "delay": "logistics_delay",
        "port_congestion": "port_congestion",
        "weather": "weather_disruption",
    }
    key = incident_type.strip().lower().replace(" ", "_")
    return mapping.get(key, "logistics_disruption")


async def _trigger_demo_disruption() -> None:
    try:
        await asyncio.sleep(max(1, settings.demo_disruption_delay_seconds))
        if simulation_engine.status != "running":
            return

        severity = min(0.99, max(0.0, settings.demo_disruption_severity))
        event_date = simulation_engine.simulation_time.date()
        with SessionLocal() as session:
            event = NewsEvent(
                original_date=event_date,
                simulation_date=event_date,
                city=settings.demo_disruption_city,
                category="Demo Disruption",
                headline=f"Automatic disruption: flood pressure in {settings.demo_disruption_city}",
                relevant=True,
                impact_type="weather_disruption",
                impact_score=severity,
                model_probability=severity,
            )
            session.add(event)
            session.commit()
            session.refresh(event)
            simulation_engine.update_news_event_map(event)

        print(
            f"[EVENT] Disruption triggered: {settings.demo_disruption_city} flood",
            flush=True,
        )
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        print(f"[ERROR] Demo disruption task failed: {exc}", flush=True)


@app.on_event("startup")
async def startup() -> None:
    global demo_disruption_task

    init_db()
    with SessionLocal() as session:
        if settings.allow_demo_seed:
            seed_demo_data(session)

    if settings.demo_mode:
        await simulation_engine.start(speed_multiplier=settings.simulation_speed)
        print("[INFO] Demo mode startup completed.", flush=True)
        if demo_disruption_task is None or demo_disruption_task.done():
            demo_disruption_task = asyncio.create_task(_trigger_demo_disruption())


@app.on_event("shutdown")
async def shutdown() -> None:
    global demo_disruption_task
    if demo_disruption_task is not None and not demo_disruption_task.done():
        demo_disruption_task.cancel()
        try:
            await demo_disruption_task
        except asyncio.CancelledError:
            pass
    demo_disruption_task = None


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name}


@app.get("/api/facilities", response_model=list[FacilityRead])
def list_facilities(session: Session = Depends(get_session)) -> list[Facility]:
    return session.scalars(select(Facility).order_by(Facility.name)).all()


@app.post("/api/facilities", response_model=FacilityRead)
def create_facility(payload: FacilityCreate, session: Session = Depends(get_session)) -> Facility:
    facility = Facility(**payload.model_dump())
    session.add(facility)
    session.commit()
    session.refresh(facility)
    return facility


@app.patch("/api/facilities/{facility_id}", response_model=FacilityRead)
def update_facility(
    facility_id: int, payload: FacilityUpdate, session: Session = Depends(get_session)
) -> Facility:
    facility = session.get(Facility, facility_id)
    if facility is None:
        raise HTTPException(status_code=404, detail="Facility not found")
    apply_updates(facility, payload.model_dump(exclude_unset=True))
    session.commit()
    session.refresh(facility)
    return facility


@app.get("/api/port-links", response_model=list[PortLinkRead])
def list_port_links(session: Session = Depends(get_session)) -> list[PortLink]:
    return session.scalars(select(PortLink).order_by(PortLink.id.desc())).all()


@app.post("/api/port-links", response_model=PortLinkRead)
def create_port_link(payload: PortLinkCreate, session: Session = Depends(get_session)) -> PortLink:
    port_link = PortLink(**payload.model_dump())
    session.add(port_link)
    session.commit()
    session.refresh(port_link)
    return port_link


@app.get("/api/drivers", response_model=list[DriverProfileRead])
def list_drivers(session: Session = Depends(get_session)) -> list[DriverProfile]:
    return session.scalars(select(DriverProfile).order_by(DriverProfile.name)).all()


@app.post("/api/drivers", response_model=DriverProfileRead)
def create_driver(payload: DriverProfileCreate, session: Session = Depends(get_session)) -> DriverProfile:
    driver = DriverProfile(**payload.model_dump())
    session.add(driver)
    session.commit()
    session.refresh(driver)
    return driver


@app.get("/api/vehicles", response_model=list[VehicleRead])
def list_vehicles(session: Session = Depends(get_session)) -> list[Vehicle]:
    return session.scalars(select(Vehicle).order_by(Vehicle.identifier)).all()


@app.post("/api/vehicles", response_model=VehicleRead)
def create_vehicle(payload: VehicleCreate, session: Session = Depends(get_session)) -> Vehicle:
    vehicle = Vehicle(**payload.model_dump())
    session.add(vehicle)
    session.commit()
    session.refresh(vehicle)
    return vehicle


@app.get("/api/vehicles/{vehicle_id}", response_model=VehicleRead)
def get_vehicle(vehicle_id: int, session: Session = Depends(get_session)) -> Vehicle:
    vehicle = session.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@app.patch("/api/vehicles/{vehicle_id}", response_model=VehicleRead)
def update_vehicle(
    vehicle_id: int, payload: VehicleUpdate, session: Session = Depends(get_session)
) -> Vehicle:
    vehicle = session.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    apply_updates(vehicle, payload.model_dump(exclude_unset=True))
    session.commit()
    session.refresh(vehicle)
    return vehicle


@app.get("/api/objectives", response_model=list[ObjectiveRead])
def list_objectives(session: Session = Depends(get_session)) -> list[Objective]:
    return session.scalars(select(Objective).order_by(Objective.priority.desc(), Objective.name)).all()


@app.post("/api/objectives", response_model=ObjectiveRead)
def create_objective(payload: ObjectiveCreate, session: Session = Depends(get_session)) -> Objective:
    objective = Objective(**payload.model_dump())
    session.add(objective)
    session.commit()
    session.refresh(objective)
    return objective


@app.patch("/api/objectives/{objective_id}", response_model=ObjectiveRead)
def update_objective(
    objective_id: int, payload: ObjectiveUpdate, session: Session = Depends(get_session)
) -> Objective:
    objective = session.get(Objective, objective_id)
    if objective is None:
        raise HTTPException(status_code=404, detail="Objective not found")
    apply_updates(objective, payload.model_dump(exclude_unset=True))
    session.commit()
    session.refresh(objective)
    return objective


@app.get("/api/routes", response_model=list[RouteTemplateRead])
def list_routes(session: Session = Depends(get_session)) -> list[RouteTemplate]:
    return session.scalars(select(RouteTemplate).order_by(RouteTemplate.refreshed_at.desc())).all()


@app.post("/api/events/import", response_model=ImportSummary)
def import_events(
    full_news_import: bool = Query(default=False),
    session: Session = Depends(get_session),
) -> ImportSummary:
    return event_ingestion_service.import_all(
        session, full_news_import=full_news_import, sample_per_sheet=600
    )


@app.get("/api/events/news", response_model=list[NewsEventRead])
def list_news_events(
    relevant_only: bool = Query(default=True), session: Session = Depends(get_session)
) -> list[NewsEvent]:
    statement = select(NewsEvent).order_by(NewsEvent.simulation_date.desc()).limit(150)
    if relevant_only:
        statement = statement.where(NewsEvent.relevant.is_(True))
    return session.scalars(statement).all()


@app.get("/api/events/weather", response_model=list[WeatherEventRead])
def list_weather_events(session: Session = Depends(get_session)) -> list[WeatherEvent]:
    return session.scalars(
        select(WeatherEvent).order_by(WeatherEvent.simulation_date.desc()).limit(150)
    ).all()


@app.post("/api/simulation/start", response_model=SimulationStatus)
async def start_simulation(payload: SimulationControlRequest | None = None) -> SimulationStatus:
    speed = payload.speed_multiplier if payload and payload.speed_multiplier else None
    return await simulation_engine.start(speed_multiplier=speed)


@app.post("/api/simulation/pause", response_model=SimulationStatus)
async def pause_simulation() -> SimulationStatus:
    return await simulation_engine.pause()


@app.post("/api/simulation/resume", response_model=SimulationStatus)
async def resume_simulation() -> SimulationStatus:
    return await simulation_engine.resume()


@app.post("/api/simulation/reset", response_model=SimulationStatus)
async def reset_simulation() -> SimulationStatus:
    return await simulation_engine.reset()


@app.get("/api/simulation/status", response_model=SimulationStatus)
def simulation_status() -> SimulationStatus:
    return simulation_engine.snapshot_status()


@app.post("/api/demo/scale-fleet", response_model=FleetScaleResult)
async def scale_demo_fleet(
    payload: FleetScaleRequest,
    session: Session = Depends(get_session),
) -> FleetScaleResult:
    objectives = session.scalars(
        select(Objective).where(Objective.active.is_(True)).order_by(Objective.priority.desc(), Objective.id)
    ).all()
    if not objectives:
        raise HTTPException(status_code=400, detail="No active objectives available to scale fleet")

    vehicles = list(session.scalars(select(Vehicle).order_by(Vehicle.id)).all())
    drivers = list(session.scalars(select(DriverProfile).order_by(DriverProfile.id)).all())
    if not drivers:
        raise HTTPException(status_code=400, detail="No drivers available")

    previous_vehicle_count = len(vehicles)
    previous_driver_count = len(drivers)
    target_vehicle_count = payload.target_vehicle_count

    # --- SCALE DOWN: remove excess vehicles and orphaned drivers ---
    if target_vehicle_count < previous_vehicle_count:
        vehicles_to_remove = vehicles[target_vehicle_count:]
        removed_vehicle_ids = {v.id for v in vehicles_to_remove}
        removed_driver_ids = {v.driver_profile_id for v in vehicles_to_remove}

        for v in vehicles_to_remove:
            session.delete(v)

        # Clean up objective assignments
        for objective in objectives:
            if objective.assigned_vehicle_ids:
                objective.assigned_vehicle_ids = [
                    vid for vid in objective.assigned_vehicle_ids if vid not in removed_vehicle_ids
                ]

        # Remove drivers that no longer have any vehicles
        for driver in drivers:
            if driver.id in removed_driver_ids:
                still_has = session.scalar(
                    select(Vehicle).where(Vehicle.driver_profile_id == driver.id).limit(1)
                )
                if still_has is None:
                    session.delete(driver)

        session.commit()
        # Refresh lists after deletion
        vehicles = list(session.scalars(select(Vehicle).order_by(Vehicle.id)).all())
        drivers = list(session.scalars(select(DriverProfile).order_by(DriverProfile.id)).all())

    new_vehicle_count = len(vehicles)
    new_driver_count = len(drivers)
    vehicles_to_create = max(0, target_vehicle_count - new_vehicle_count)

    desired_driver_count = max(new_driver_count, ceil(target_vehicle_count * 0.6))
    existing_driver_names = {driver.name for driver in drivers}
    driver_seq = 1
    while len(drivers) < desired_driver_count:
        while True:
            candidate_name = f"Ops Driver {driver_seq:03d}"
            driver_seq += 1
            if candidate_name not in existing_driver_names:
                break
        driver = DriverProfile(
            name=candidate_name,
            override_rating=1.0,
            confidence=0.58,
            accept_recommendation_bias=0.55,
            active=True,
        )
        session.add(driver)
        drivers.append(driver)
        existing_driver_names.add(candidate_name)
    session.flush()

    objective_vehicle_templates: dict[int, list[Vehicle]] = {objective.id: [] for objective in objectives}
    for vehicle in vehicles:
        if vehicle.default_objective_id in objective_vehicle_templates:
            objective_vehicle_templates[vehicle.default_objective_id].append(vehicle)

    if vehicles:
        fallback_template = vehicles[0]
    else:
        raise HTTPException(status_code=400, detail="No base vehicle available for scaling")

    for objective in objectives:
        if not objective_vehicle_templates[objective.id]:
            assigned = set(objective.assigned_vehicle_ids or [])
            seeded = [vehicle for vehicle in vehicles if vehicle.id in assigned]
            objective_vehicle_templates[objective.id] = seeded or [fallback_template]

    existing_identifiers = {vehicle.identifier for vehicle in vehicles}
    identifier_sequence = new_vehicle_count + 1

    def next_identifier() -> str:
        nonlocal identifier_sequence
        while True:
            candidate = f"OPS-{identifier_sequence:04d}"
            identifier_sequence += 1
            if candidate not in existing_identifiers:
                existing_identifiers.add(candidate)
                return candidate

    created_vehicles_by_objective: dict[int, list[Vehicle]] = {objective.id: [] for objective in objectives}
    for index in range(vehicles_to_create):
        objective = objectives[index % len(objectives)]
        template_pool = objective_vehicle_templates[objective.id] or [fallback_template]
        template = template_pool[index % len(template_pool)]
        driver = drivers[index % len(drivers)]

        capacity_factor = 0.9 + (index % 6) * 0.035
        speed_factor = 0.92 + (index % 5) * 0.02
        emission_factor = 0.9 + (index % 4) * 0.03

        vehicle = Vehicle(
            identifier=next_identifier(),
            vehicle_type=template.vehicle_type,
            payload_capacity_units=max(500, int(template.payload_capacity_units * capacity_factor)),
            home_facility_id=objective.origin_facility_id,
            current_facility_id=objective.origin_facility_id,
            driver_profile_id=driver.id,
            default_objective_id=objective.id,
            average_speed_kmph=round(max(32.0, template.average_speed_kmph * speed_factor), 2),
            emission_kg_per_km=round(max(0.9, template.emission_kg_per_km * emission_factor), 3),
            rest_every_hours=template.rest_every_hours,
            rest_duration_minutes=template.rest_duration_minutes,
            status="idle",
        )
        session.add(vehicle)
        created_vehicles_by_objective[objective.id].append(vehicle)

    session.flush()

    objective_assignment_counts: dict[str, int] = {}
    for objective in objectives:
        new_ids = [vehicle.id for vehicle in created_vehicles_by_objective[objective.id]]
        merged_ids = list(dict.fromkeys([*(objective.assigned_vehicle_ids or []), *new_ids]))
        objective.assigned_vehicle_ids = merged_ids
        objective_assignment_counts[objective.name] = len(merged_ids)

    session.commit()

    if payload.reset_simulation:
        await simulation_engine.reset()
        if payload.auto_start:
            simulation_status = await simulation_engine.start(speed_multiplier=payload.speed_multiplier)
        else:
            simulation_status = simulation_engine.snapshot_status()
    else:
        simulation_status = simulation_engine.snapshot_status()

    return FleetScaleResult(
        previous_vehicle_count=previous_vehicle_count,
        new_vehicle_count=target_vehicle_count,
        created_vehicles=vehicles_to_create,
        previous_driver_count=previous_driver_count,
        new_driver_count=len(drivers),
        created_drivers=max(0, len(drivers) - previous_driver_count),
        objective_assignment_counts=objective_assignment_counts,
        simulation=simulation_status,
    )


@app.get("/api/scenarios", response_model=list[ScenarioPresetRead])
def list_scenarios(session: Session = Depends(get_session)) -> list[ScenarioPreset]:
    return session.scalars(
        select(ScenarioPreset).where(ScenarioPreset.active.is_(True)).order_by(ScenarioPreset.name)
    ).all()


@app.post("/api/scenarios/{scenario_key}/trigger")
def trigger_scenario(scenario_key: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    scenario = session.scalar(
        select(ScenarioPreset).where(
            ScenarioPreset.scenario_key == scenario_key,
            ScenarioPreset.active.is_(True),
        )
    )
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    event_date = simulation_engine.simulation_time.date()
    event = NewsEvent(
        original_date=event_date,
        simulation_date=event_date,
        city=scenario.event_city,
        category="Scenario Trigger",
        headline=f"Scenario triggered: {scenario.name}",
        relevant=True,
        impact_type=scenario.event_type,
        impact_score=min(0.99, max(0.0, scenario.severity)),
        model_probability=min(0.99, max(0.0, scenario.severity)),
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    simulation_engine.update_news_event_map(event)
    print(f"[EVENT] Disruption triggered: {scenario.event_city} {scenario.event_type}", flush=True)
    return {
        "status": "triggered",
        "scenario_key": scenario.scenario_key,
        "event_city": scenario.event_city,
        "severity": scenario.severity,
    }


@app.get("/api/scenarios/{scenario_key}/compare", response_model=ScenarioComparisonRead)
def compare_scenario(scenario_key: str, session: Session = Depends(get_session)) -> ScenarioComparisonRead:
    scenario = session.scalar(
        select(ScenarioPreset).where(
            ScenarioPreset.scenario_key == scenario_key,
            ScenarioPreset.active.is_(True),
        )
    )
    if scenario is None:
        raise HTTPException(status_code=404, detail="Scenario not found")

    comparison = simulation_engine.compare_scenario(session, scenario)
    return ScenarioComparisonRead(
        scenario_key=scenario.scenario_key,
        scenario_name=scenario.name,
        baseline=ScenarioComparisonMetrics(**comparison["baseline"]),
        ai=ScenarioComparisonMetrics(**comparison["ai"]),
        improvement_summary=comparison["improvement"],
    )


@app.get("/api/dashboard", response_model=DashboardSnapshot)
def dashboard(session: Session = Depends(get_session)) -> DashboardSnapshot:
    return simulation_engine.dashboard_snapshot(session)


@app.get("/api/recommendations", response_model=list[RecommendationRead])
def list_recommendations(session: Session = Depends(get_session)) -> list[Recommendation]:
    return session.scalars(
        select(Recommendation).order_by(Recommendation.created_at.desc()).limit(100)
    ).all()


@app.post("/api/recommendations/{recommendation_id}/decision", response_model=DriverDecisionRead)
def recommendation_decision(
    recommendation_id: int,
    payload: RecommendationDecisionRequest,
    session: Session = Depends(get_session),
) -> DriverDecision:
    recommendation = session.get(Recommendation, recommendation_id)
    if recommendation is None:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    existing = session.scalar(
        select(DriverDecision).where(DriverDecision.recommendation_id == recommendation.id)
    )
    if existing is not None:
        return existing

    vehicle = session.get(Vehicle, recommendation.vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    driver = session.get(DriverProfile, vehicle.driver_profile_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")

    backend_decision = "accepted" if payload.decision == "accept" else "ignored"
    recommendation.status = backend_decision
    rating_delta = 0.05 if backend_decision == "accepted" else -0.08
    driver.override_rating = round(max(0.2, driver.override_rating + rating_delta), 3)
    note = (
        "Driver accepted mobile recommendation."
        if backend_decision == "accepted"
        else "Driver ignored mobile recommendation."
    )

    decision = DriverDecision(
        recommendation_id=recommendation.id,
        driver_profile_id=driver.id,
        vehicle_id=vehicle.id,
        decision=backend_decision,
        actual_trip_cost=(
            recommendation.recommended_cost if backend_decision == "accepted"
            else recommendation.baseline_cost
        ),
        recommended_trip_cost=recommendation.recommended_cost,
        rating_delta=rating_delta,
        note=note,
    )
    session.add(decision)
    session.commit()
    session.refresh(decision)
    return decision


@app.get("/api/driver-decisions", response_model=list[DriverDecisionRead])
def list_driver_decisions(session: Session = Depends(get_session)) -> list[DriverDecision]:
    return session.scalars(
        select(DriverDecision).order_by(DriverDecision.decided_at.desc()).limit(100)
    ).all()


@app.get("/api/driver/{driver_id}/mobile", response_model=DriverMobileSnapshot)
def driver_mobile_snapshot(driver_id: int, session: Session = Depends(get_session)) -> DriverMobileSnapshot:
    driver = session.get(DriverProfile, driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")

    driver_vehicles = session.scalars(
        select(Vehicle).where(Vehicle.driver_profile_id == driver_id)
    ).all()
    vehicle_ids = {vehicle.id for vehicle in driver_vehicles}
    vehicle_lookup = {vehicle.id: vehicle for vehicle in driver_vehicles}
    objective_lookup = {
        objective.id: objective for objective in session.scalars(select(Objective)).all()
    }

    recent_recommendations = session.scalars(
        select(Recommendation).order_by(Recommendation.created_at.desc()).limit(200)
    ).all()
    pending_instructions: list[DriverInstructionRead] = []
    for recommendation in recent_recommendations:
        if recommendation.vehicle_id not in vehicle_ids:
            continue
        if recommendation.status != "suggested":
            continue
        vehicle = vehicle_lookup[recommendation.vehicle_id]
        objective = objective_lookup.get(recommendation.objective_id)
        pending_instructions.append(
            DriverInstructionRead(
                recommendation_id=recommendation.id,
                created_at=recommendation.created_at,
                vehicle_id=vehicle.id,
                vehicle_identifier=vehicle.identifier,
                objective_name=objective.name if objective else "Unassigned Objective",
                action=recommendation.action,
                explanation=recommendation.explanation,
                status=recommendation.status,
            )
        )
        if len(pending_instructions) >= 20:
            break

    recent_incidents = session.scalars(
        select(DriverIncident)
        .where(DriverIncident.driver_profile_id == driver_id)
        .order_by(DriverIncident.reported_at.desc())
        .limit(20)
    ).all()

    return DriverMobileSnapshot(
        driver_id=driver.id,
        driver_name=driver.name,
        override_rating=driver.override_rating,
        confidence=driver.confidence,
        pending_instructions=pending_instructions,
        recent_incidents=recent_incidents,
    )


@app.post("/api/driver/decision", response_model=DriverDecisionRead)
def submit_driver_decision(
    payload: DriverResponseRequest,
    session: Session = Depends(get_session),
) -> DriverDecision:
    recommendation = session.get(Recommendation, payload.recommendation_id)
    if recommendation is None:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    existing = session.scalar(
        select(DriverDecision).where(DriverDecision.recommendation_id == recommendation.id)
    )
    if existing is not None:
        return existing

    vehicle = session.get(Vehicle, recommendation.vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    driver = session.get(DriverProfile, vehicle.driver_profile_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")

    recommendation.status = payload.decision
    rating_delta = 0.05 if payload.decision == "accepted" else -0.08
    driver.override_rating = round(max(0.2, driver.override_rating + rating_delta), 3)
    note = payload.note.strip() or (
        "Driver accepted mobile recommendation." if payload.decision == "accepted"
        else "Driver ignored mobile recommendation."
    )

    decision = DriverDecision(
        recommendation_id=recommendation.id,
        driver_profile_id=driver.id,
        vehicle_id=vehicle.id,
        decision=payload.decision,
        actual_trip_cost=(
            recommendation.recommended_cost if payload.decision == "accepted"
            else recommendation.baseline_cost
        ),
        recommended_trip_cost=recommendation.recommended_cost,
        rating_delta=rating_delta,
        note=note,
    )
    session.add(decision)
    session.commit()
    session.refresh(decision)
    return decision


@app.post("/api/driver/incidents", response_model=DriverIncidentRead)
def report_driver_incident(
    payload: DriverIncidentCreate,
    session: Session = Depends(get_session),
) -> DriverIncident:
    driver = session.get(DriverProfile, payload.driver_profile_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    if payload.vehicle_id is not None and session.get(Vehicle, payload.vehicle_id) is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    severity = min(0.99, max(0.0, payload.severity))
    incident_date = simulation_engine.simulation_time.date()
    news_event = NewsEvent(
        original_date=incident_date,
        simulation_date=incident_date,
        city=payload.city,
        category="Driver Incident",
        headline=f"Driver report: {payload.incident_type} in {payload.city}",
        relevant=True,
        impact_type=normalize_incident_impact_type(payload.incident_type),
        impact_score=severity,
        model_probability=severity,
    )
    session.add(news_event)
    session.flush()

    incident = DriverIncident(
        driver_profile_id=payload.driver_profile_id,
        vehicle_id=payload.vehicle_id,
        city=payload.city,
        incident_type=payload.incident_type,
        severity=severity,
        note=payload.note,
        linked_news_event_id=news_event.id,
    )
    session.add(incident)
    session.commit()
    session.refresh(incident)
    session.refresh(news_event)
    simulation_engine.update_news_event_map(news_event)
    print(f"[EVENT] Disruption triggered: {payload.city} {payload.incident_type}", flush=True)
    return incident


@app.get("/api/driver/incidents", response_model=list[DriverIncidentRead])
def list_driver_incidents(session: Session = Depends(get_session)) -> list[DriverIncident]:
    return session.scalars(
        select(DriverIncident).order_by(DriverIncident.reported_at.desc()).limit(120)
    ).all()


@app.get("/api/metrics/sdg", response_model=MetricsSummary)
def sdg_metrics(session: Session = Depends(get_session)) -> MetricsSummary:
    snapshot = session.scalar(
        select(MetricsSnapshot).order_by(MetricsSnapshot.captured_at.desc()).limit(1)
    )
    current = simulation_engine.current_metrics
    if snapshot is None:
        return current
    return MetricsSummary(
        co2_saved_kg=snapshot.co2_saved_kg,
        idle_minutes_prevented=snapshot.idle_minutes_prevented,
        on_time_delivery_pct=snapshot.on_time_delivery_pct,
        warehouse_utilization_pct=snapshot.warehouse_utilization_pct,
        reroute_count=snapshot.reroute_count,
        active_trucks=snapshot.active_trucks,
        queued_trucks=snapshot.queued_trucks,
        stockouts_prevented=getattr(snapshot, "stockouts_prevented", current.stockouts_prevented),
        critical_deliveries_saved=getattr(
            snapshot, "critical_deliveries_saved", current.critical_deliveries_saved
        ),
        beneficiary_locations_served=getattr(
            snapshot, "beneficiary_locations_served", current.beneficiary_locations_served
        ),
        spoilage_or_wastage_prevented=getattr(
            snapshot, "spoilage_or_wastage_prevented", current.spoilage_or_wastage_prevented
        ),
    )


# ===========================
# NEW: RL Decision Engine
# ===========================
@app.post("/api/ai/rl-decision", response_model=RLDecisionResponse)
def rl_decision(payload: RLDecisionRequest) -> RLDecisionResponse:
    if not settings.use_rl_engine:
        raise HTTPException(status_code=503, detail="RL engine is disabled")
    engine = get_rl_engine()
    state = StateVector.from_sim_context(
        facility_utilization=payload.facility_utilization,
        route_risk=payload.route_risk,
        eta_multiplier=payload.eta_multiplier,
        sla_remaining_minutes=payload.sla_remaining_minutes,
        sla_total_minutes=payload.sla_total_minutes,
        payload_capacity=payload.payload_capacity,
        facility_capacity=payload.facility_capacity,
        priority=payload.priority,
        port_pressure=payload.port_pressure,
        weather_severity=payload.weather_severity,
        news_severity=payload.news_severity,
        simulation_hour=payload.simulation_hour,
    )
    action, confidence = engine.select_action(state, payload.valid_actions)
    probs = engine.get_action_confidence(state)
    return RLDecisionResponse(action=action, confidence=confidence, action_probs=probs)


@app.post("/api/ai/rl-train")
def rl_train() -> dict[str, Any]:
    if not settings.use_rl_engine:
        raise HTTPException(status_code=503, detail="RL engine is disabled")
    engine = get_rl_engine()
    result = engine.train_step_update()
    if result is None:
        return {"status": "insufficient_data", "buffer_size": len(engine.replay_buffer)}
    engine.save_weights()
    return {"status": "trained", **result}


# ===========================
# NEW: Predictive Forecasting & Risk Heatmap
# ===========================
@app.get("/api/forecast/risk", response_model=list[RiskForecastRead])
def risk_forecast(
    hours: int = Query(default=12, ge=1, le=72),
    session: Session = Depends(get_session),
) -> list[dict[str, Any]]:
    cities = {f.city for f in session.scalars(select(Facility)).all()}
    sim_date = simulation_engine.simulation_time.date()
    data = forecast_service.get_heatmap_data(session, cities, forecast_hours=hours, reference_date=sim_date)
    return [RiskForecastRead(**d).model_dump() for d in data]


@app.get("/api/forecast/city/{city}")
def city_forecast(city: str, hours: int = Query(default=12, ge=1, le=72), session: Session = Depends(get_session)) -> dict[str, Any] | None:
    sim_date = simulation_engine.simulation_time.date()
    fc = forecast_service.forecast_city(session, city, forecast_hours=hours, reference_date=sim_date)
    if fc is None:
        raise HTTPException(status_code=404, detail=f"No forecast data for {city}")
    return {
        "city": fc.city,
        "predicted_route_risk": fc.predicted_route_risk,
        "predicted_eta_multiplier": fc.predicted_eta_multiplier,
        "predicted_closure_risk": fc.predicted_closure_risk,
        "confidence": fc.confidence,
        "contributing_factors": fc.contributing_factors,
        "forecast_time": fc.forecast_time.isoformat(),
    }


# ===========================
# NEW: Multi-Objective Optimization (NSGA-II)
# ===========================
@app.post("/api/ai/optimize-dispatch", response_model=list[ParetoFrontRead])
def optimize_dispatch(session: Session = Depends(get_session)) -> list[ParetoFrontRead]:
    if not settings.use_nsga2_optimizer:
        raise HTTPException(status_code=503, detail="NSGA-II optimizer is disabled")

    objectives = session.scalars(select(Objective).where(Objective.active.is_(True))).all()
    vehicles = session.scalars(select(Vehicle)).all()
    if not objectives or not vehicles:
        raise HTTPException(status_code=400, detail="No active objectives or vehicles")

    available_destinations: list[list[int]] = []
    for objective in objectives:
        dests = [objective.destination_facility_id, *objective.fallback_facility_ids]
        available_destinations.append(dests)

    def eval_fn(genome: list[Any]) -> list[float]:
        total_time = 0.0
        total_co2 = 0.0
        overload = 0.0
        sla_violations = 0.0
        total_cost = 0.0
        for gene, objective in zip(genome, objectives):
            route_duration = 120.0  # simplified
            if gene.action == "reroute_warehouse" or gene.action == "reroute_port":
                route_duration *= 1.15
                total_co2 += 5.0
            elif gene.action == "wait":
                route_duration += 40.0
            elif gene.action == "defer_dispatch":
                route_duration += objective.dispatch_interval_minutes
            total_time += route_duration
            if route_duration > objective.sla_minutes:
                sla_violations += 1.0
            total_cost += route_duration * 0.5 + overload * 10.0
        return [total_time, total_co2, overload, sla_violations, total_cost]

    optimizer = NSGA2Optimizer(population_size=40, generations=20)
    pareto = optimizer.optimize(len(objectives), available_destinations, eval_fn)
    return [
        ParetoFrontRead(
            objectives=ind.objectives.tolist(),
            genome=[{"action": g.action, "destination_id": g.destination_id} for g in ind.genome],
            rank=ind.rank,
            crowding_distance=ind.crowding_distance,
        )
        for ind in pareto
    ]


# ===========================
# NEW: Blockchain Audit Trail
# ===========================
@app.get("/api/audit/chain", response_model=list[BlockchainBlockRead])
def audit_chain(limit: int = Query(default=50, ge=1, le=200)) -> list[dict[str, Any]]:
    ledger = get_ledger()
    blocks = ledger.get_chain(limit)
    for b in blocks:
        b["hash"] = AuditBlock(**b).compute_hash() if "hash" not in b else b.get("hash")
    return blocks


@app.get("/api/audit/entity/{entity_id}")
def audit_entity_history(entity_id: int, decision_type: str | None = None) -> list[dict[str, Any]]:
    ledger = get_ledger()
    return ledger.get_entity_history(entity_id, decision_type)


@app.get("/api/audit/verify", response_model=BlockchainVerifyRead)
def audit_verify() -> BlockchainVerifyRead:
    result = get_ledger().verify_integrity()
    return BlockchainVerifyRead(**result)


# ===========================
# NEW: Inventory Optimization
# ===========================
@app.get("/api/inventory/forecasts", response_model=list[InventoryForecastRead])
def inventory_forecasts(session: Session = Depends(get_session)) -> list[InventoryForecastRead]:
    forecasts = inventory_optimizer.get_all_forecasts(session)
    return [
        InventoryForecastRead(
            facility_id=f.facility_id,
            facility_name=f.facility_name,
            predicted_demand_units=f.predicted_demand_units,
            safety_stock_units=f.safety_stock_units,
            reorder_point=f.reorder_point,
            recommended_dispatch_count=f.recommended_dispatch_count,
            confidence=f.confidence,
            forecast_period_hours=f.forecast_period_hours,
            trend=f.trend,
        )
        for f in forecasts
    ]


@app.get("/api/inventory/proactive-dispatches", response_model=list[ProactiveDispatchRead])
def proactive_dispatches(session: Session = Depends(get_session)) -> list[ProactiveDispatchRead]:
    recs = inventory_optimizer.recommend_proactive_dispatches(session)
    return [
        ProactiveDispatchRead(
            origin_facility_id=r.origin_facility_id,
            destination_facility_id=r.destination_facility_id,
            recommended_units=r.recommended_units,
            urgency=r.urgency,
            reason=r.reason,
            eta_hours=r.eta_hours,
        )
        for r in recs
    ]


# ===========================
# NEW: Edge Sync / Offline-First
# ===========================
@app.get("/api/edge/sync/{driver_id}", response_model=EdgeSyncStatusRead)
def edge_sync_status(driver_id: int) -> EdgeSyncStatusRead:
    status = get_edge_sync_manager().get_sync_status(driver_id)
    return EdgeSyncStatusRead(**status)


@app.post("/api/edge/sync/{driver_id}")
def edge_sync_operations(driver_id: int) -> dict[str, Any]:
    return get_edge_sync_manager().sync_operations(driver_id)


@app.post("/api/edge/queue/{driver_id}")
def edge_queue_operation(
    driver_id: int,
    op_type: str = Query(...),
    payload: dict[str, Any] | None = None,
    vehicle_id: int | None = None,
) -> dict[str, Any]:
    op = get_edge_sync_manager().queue_operation(driver_id, op_type, payload or {}, vehicle_id)
    return {"status": "queued", "op_id": op.op_id, "checksum": op.checksum}


# ===========================
# NEW: Google Cloud Integration Health
# ===========================
@app.get("/api/cloud/health", response_model=CloudHealthRead)
def cloud_health() -> CloudHealthRead:
    health = get_gcp_integration().health_check()
    return CloudHealthRead(**health)


# ===========================
# NEW: Voice Decision Stub (returns config for frontend)
# ===========================
@app.get("/api/driver/voice-config")
def voice_config() -> dict[str, Any]:
    return {
        "enabled": True,
        "languages": ["en-IN", "hi-IN", "ta-IN", "te-IN", "bn-IN"],
        "incident_types": [
            {"key": "road_blockage", "label": "Road Blockage"},
            {"key": "strike", "label": "Strike"},
            {"key": "delay", "label": "Delay"},
            {"key": "port_congestion", "label": "Port Congestion"},
            {"key": "weather", "label": "Weather"},
        ],
        "note": "Frontend should use Web Speech API for voice input",
    }


@app.websocket("/ws/operations")
async def operations_socket(websocket: WebSocket) -> None:
    await simulation_engine.connection_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        simulation_engine.connection_manager.disconnect(websocket)


FRONTEND_DIST = Path("frontend/dist")
DRIVER_DIST = Path("driver-app-main/dist")

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/", include_in_schema=False)
    async def frontend_index() -> FileResponse:
        return FileResponse(FRONTEND_DIST / "index.html")

if DRIVER_DIST.exists():
    app.mount("/driver-assets", StaticFiles(directory=DRIVER_DIST / "assets"), name="driver_assets")

    @app.get("/driver", include_in_schema=False)
    async def driver_index() -> FileResponse:
        return FileResponse(DRIVER_DIST / "index.html")

else:

    @app.get("/", include_in_schema=False)
    async def placeholder_index() -> HTMLResponse:
        return HTMLResponse(
            """
            <html>
<head><title>Resilient Essential Goods Coordinator</title></head>
              <body style="font-family:Segoe UI, sans-serif;padding:32px;background:#101622;color:#f4f7fb;">
<h1>Resilient Essential Goods Coordinator API</h1>
                <p>The FastAPI backend is running. Build the React admin panel in <code>frontend/</code> to serve it here.</p>
                <p>Core endpoints are available under <code>/api/*</code> and the live stream is at <code>/ws/operations</code>.</p>
              </body>
            </html>
            """
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
