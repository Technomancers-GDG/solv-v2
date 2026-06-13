"""Resilient Essential Goods Coordinator — FastAPI application entry point."""
from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from limiter import limiter


try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth, credentials
    _firebase_available = True
except Exception:
    _firebase_available = False
    firebase_auth = None

from config import settings
from database import SessionLocal, init_db
from seed_data import seed_demo_data

from app_state import simulation_engine
from routes import crud_router, simulation_router, driver_router, ai_router, logistics_router, rl_router, comparison_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    global demo_disruption_task
    init_db()
    with SessionLocal() as session:
        if settings.allow_demo_seed:
            seed_demo_data(session)
    if settings.demo_mode:
        await simulation_engine.start(speed_multiplier=settings.simulation_speed)
        if demo_disruption_task is None or demo_disruption_task.done():
            demo_disruption_task = asyncio.create_task(_trigger_demo_disruption())
    yield
    if demo_disruption_task is not None and not demo_disruption_task.done():
        demo_disruption_task.cancel()
        try:
            await demo_disruption_task
        except asyncio.CancelledError:
            pass
    demo_disruption_task = None

app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    origins = [o.strip() for o in cors_origins_env.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

demo_disruption_task: asyncio.Task | None = None

app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(Exception)
async def cors_aware_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    origin = request.headers.get("origin", "")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={"Access-Control-Allow-Origin": origin or "*"},
    )


# --- Router registration ---
app.include_router(crud_router)
app.include_router(simulation_router)
app.include_router(driver_router)
app.include_router(ai_router)
app.include_router(logistics_router)
app.include_router(rl_router)
app.include_router(comparison_router)


# --- Auth ---
@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "app": settings.app_name}


@app.get("/api/auth/me")
def auth_me(request: Request) -> dict:
    user = _verify_firebase_token(request)
    if user is None:
        return {"authenticated": False, "message": "No valid Firebase token provided. Demo mode active."}
    return {"authenticated": True, "uid": user.get("uid"), "email": user.get("email"), "name": user.get("name")}


def _init_firebase() -> None:
    if not _firebase_available:
        return
    try:
        firebase_admin.get_app()
    except ValueError:
        try:
            firebase_admin.initialize_app(credentials.Certificate("firebase-service-account.json"))
        except Exception:
            firebase_admin.initialize_app()


def _verify_firebase_token(request: Request) -> dict | None:
    if not _firebase_available:
        return None
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    try:
        _init_firebase()
        return firebase_auth.verify_id_token(auth_header.replace("Bearer ", ""), clock_skew_seconds=60)
    except Exception:
        return None


# --- Demo disruption task ---
async def _trigger_demo_disruption() -> None:
    try:
        await asyncio.sleep(max(1, settings.demo_disruption_delay_seconds))
        if simulation_engine.status != "running":
            return
        severity = min(0.99, max(0.0, settings.demo_disruption_severity))
        event_date = simulation_engine.simulation_time.date()
        with SessionLocal() as session:
            from models import NewsEvent
            event = NewsEvent(
                original_date=event_date, simulation_date=event_date, city=settings.demo_disruption_city,
                category="Demo Disruption", headline=f"Automatic disruption: flood pressure in {settings.demo_disruption_city}",
                relevant=True, impact_type="weather_disruption", impact_score=severity, model_probability=severity,
            )
            session.add(event)
            session.commit()
            session.refresh(event)
            simulation_engine.update_news_event_map(event)
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        logger.error("Demo disruption task failed: %s", exc)




# --- WebSocket ---
@app.websocket("/ws/operations")
async def operations_socket(websocket: WebSocket) -> None:
    await simulation_engine.connection_manager.connect(websocket)
    try:
        with SessionLocal() as session:
            await websocket.send_json(
                {"type": "simulation_snapshot", "payload": simulation_engine.dashboard_snapshot(session).model_dump(mode="json")}
            )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        simulation_engine.connection_manager.disconnect(websocket)


# --- Static file serving ---
FRONTEND_DIST = Path("frontend/dist")
DRIVER_DIST = Path("driver-app-main/dist")

if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/", include_in_schema=False)
    async def frontend_index() -> FileResponse:
        return FileResponse(FRONTEND_DIST / "index.html")

if DRIVER_DIST.exists():
    app.mount("/driver-assets", StaticFiles(directory=DRIVER_DIST), name="driver_assets")

    @app.get("/driver", include_in_schema=False)
    async def driver_index() -> FileResponse:
        return FileResponse(DRIVER_DIST / "index.html")
else:
    @app.get("/", include_in_schema=False)
    async def placeholder_index() -> HTMLResponse:
        return HTMLResponse("""
            <html>
            <head><title>Resilient Essential Goods Coordinator</title></head>
            <body style="font-family:Segoe UI, sans-serif;padding:32px;background:#101622;color:#f4f7fb;">
            <h1>Resilient Essential Goods Coordinator API</h1>
            <p>The FastAPI backend is running. Build the React admin panel in <code>frontend/</code> to serve it here.</p>
            <p>Core endpoints are available under <code>/api/*</code> and the live stream is at <code>/ws/operations</code>.</p>
            </body>
            </html>
        """)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)