"""Multi-tenant simulation manager — manages per-client SimulationEngine instances."""
from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import asdict
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from database import SessionLocal
from models import ClientSimulation

logger = logging.getLogger(__name__)


class SimulationManager:
    def __init__(self) -> None:
        self._engines: dict[int | None, Any] = {}
        self._lock = asyncio.Lock()
        self._save_task: asyncio.Task[None] | None = None

    def get_engine(self, client_id: int | None) -> Any | None:
        return self._engines.get(client_id)

    def register_engine(self, client_id: int | None, engine: Any) -> None:
        self._engines[client_id] = engine

    def remove_engine(self, client_id: int) -> None:
        self._engines.pop(client_id, None)

    async def start_client(self, client_id: int, session: Session) -> Any:
        from app_state import route_planner
        from services.simulation import SimulationEngine

        async with self._lock:
            if client_id in self._engines:
                engine = self._engines[client_id]
                if engine.status not in ("running",):
                    await engine.start()
                return engine

            engine = SimulationEngine(route_planner, client_id=client_id, channel=f"client_{client_id}")
            engine.load_state(session)
            self._engines[client_id] = engine
            await engine.start()
            return engine

    async def stop_client(self, client_id: int) -> None:
        async with self._lock:
            engine = self._engines.get(client_id)
            if engine is not None:
                await engine.stop()
                with SessionLocal() as session:
                    engine.save_state(session)
                self._engines.pop(client_id, None)

    async def stop_all(self) -> None:
        async with self._lock:
            for engine in list(self._engines.values()):
                try:
                    await engine.stop()
                except Exception as exc:
                    logger.error("Error stopping engine: %s", exc)
            self._engines.clear()

    async def save_all(self, session: Session) -> None:
        async with self._lock:
            for engine in list(self._engines.values()):
                try:
                    engine.save_state(session)
                except Exception as exc:
                    logger.error("Error saving engine state: %s", exc)

    async def start_all(self, session: Session) -> None:
        """Restore all previously running engines on server boot."""
        rows = session.scalars(
            select(ClientSimulation).where(ClientSimulation.status.in_(["running", "paused"]))
        ).all()

        for row in rows:
            try:
                from app_state import route_planner
                from services.simulation import SimulationEngine

                engine = SimulationEngine(route_planner, client_id=row.client_id, channel=f"client_{row.client_id}")
                engine.load_state(session)
                engine.restore_state(row)
                self._engines[row.client_id] = engine

                if row.status == "running":
                    engine._task = asyncio.create_task(engine._run_loop())
                    engine.status = "running"
                else:
                    engine.status = "paused"

                logger.info("Restored engine for client %s (status=%s)", row.client_id, row.status)
            except Exception as exc:
                logger.error("Failed to restore engine for client %s: %s", row.client_id, exc)


simulation_manager = SimulationManager()
