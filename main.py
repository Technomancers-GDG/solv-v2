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
    DriverProfile,
    Facility,
    MetricsSnapshot,
    NewsEvent,
    Objective,
    PortLink,
    Recommendation,
    RouteTemplate,
    Vehicle,
    WeatherEvent,
)
from schemas import (
    DashboardSnapshot,
    DriverDecisionRead,
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


@app.get("/api/metrics/sdg", response_model=MetricsSummary)
def sdg_metrics(session: Session = Depends(get_session)) -> MetricsSummary:
    snapshot = session.scalar(
        select(MetricsSnapshot).order_by(MetricsSnapshot.captured_at.desc()).limit(1)
    )
    if snapshot is None:
        return simulation_engine.current_metrics
    return MetricsSummary(
        co2_saved_kg=snapshot.co2_saved_kg,
        idle_minutes_prevented=snapshot.idle_minutes_prevented,
        on_time_delivery_pct=snapshot.on_time_delivery_pct,
        warehouse_utilization_pct=snapshot.warehouse_utilization_pct,
        reroute_count=snapshot.reroute_count,
        active_trucks=snapshot.active_trucks,
        queued_trucks=snapshot.queued_trucks,
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
              <head><title>Supply Chain Optimizer</title></head>
              <body style="font-family:Segoe UI, sans-serif;padding:32px;background:#101622;color:#f4f7fb;">
                <h1>Supply Chain Optimizer API</h1>
                <p>The FastAPI backend is running. Build the React admin panel in <code>frontend/</code> to serve it here.</p>
                <p>Core endpoints are available under <code>/api/*</code> and the live stream is at <code>/ws/operations</code>.</p>
              </body>
            </html>
            """
        )
