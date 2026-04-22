from __future__ import annotations

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
    DashboardSnapshot,
    DriverDecisionRead,
    DriverIncidentCreate,
    DriverIncidentRead,
    DriverInstructionRead,
    DriverMobileSnapshot,
    DriverResponseRequest,
    DriverProfileCreate,
    DriverProfileRead,
    FacilityCreate,
    FacilityRead,
    FacilityUpdate,
    ImportSummary,
    MetricsSummary,
    ObjectiveCreate,
    ObjectiveRead,
    ObjectiveUpdate,
    PortLinkCreate,
    PortLinkRead,
    RecommendationRead,
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
from services.event_ingestion import EventIngestionService
from services.news_relevance import NewsRelevanceService
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


@app.on_event("startup")
async def startup() -> None:
    init_db()
    with SessionLocal() as session:
        seed_demo_data(session)
        if session.scalar(select(WeatherEvent.id).limit(1)) is None and settings.weather_dataset_path.exists():
            event_ingestion_service.import_weather(session)
        if session.scalar(select(NewsEvent.id).limit(1)) is None and settings.news_dataset_path.exists():
            event_ingestion_service.import_news(session, full_news_import=False, sample_per_sheet=160)


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
    simulation_engine._load_event_maps(session)
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
    simulation_engine._load_event_maps(session)
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


@app.websocket("/ws/operations")
async def operations_socket(websocket: WebSocket) -> None:
    await simulation_engine.connection_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        simulation_engine.connection_manager.disconnect(websocket)


FRONTEND_DIST = Path("frontend/dist")

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/", include_in_schema=False)
    async def frontend_index() -> FileResponse:
        return FileResponse(FRONTEND_DIST / "index.html")

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
