from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    app_name: str
    database_url: str
    osrm_base_url: str
    simulation_start_date: date
    simulation_speed: float
    news_dataset_path: Path
    weather_dataset_path: Path
    allow_demo_seed: bool
    demo_mode: bool
    route_use_osrm: bool
    news_model_artifact_path: Path
    demo_disruption_delay_seconds: int
    demo_disruption_city: str
    demo_disruption_severity: float


def _get_env(name: str, default: str) -> str:
    value = os.getenv(name)
    return value if value not in (None, "") else default


def _get_bool_env(name: str, default: str) -> bool:
    return _get_env(name, default).lower() in {"1", "true", "yes"}


def load_settings() -> Settings:
    return Settings(
        app_name=_get_env("APP_NAME", "Resilient Essential Goods Coordinator"),
        database_url=_get_env("DATABASE_URL", "sqlite:///./supply_chain.db"),
        osrm_base_url=_get_env("OSRM_BASE_URL", "https://router.project-osrm.org"),
        simulation_start_date=date.fromisoformat(
            _get_env("SIMULATION_START_DATE", "2026-01-01")
        ),
        simulation_speed=float(_get_env("SIMULATION_SPEED", "120.0")),
        news_dataset_path=Path(_get_env("NEWS_DATASET_PATH", "All_Cities_News_v2.xlsx")),
        weather_dataset_path=Path(
            _get_env("WEATHER_DATASET_PATH", "Historical_Weather_Data_2024_2026.xlsx")
        ),
        allow_demo_seed=_get_bool_env("ALLOW_DEMO_SEED", "true"),
        demo_mode=_get_bool_env("DEMO_MODE", "true"),
        route_use_osrm=_get_bool_env("ROUTE_USE_OSRM", "false"),
        news_model_artifact_path=Path(_get_env("NEWS_MODEL_ARTIFACT_PATH", "news_model.pkl")),
        demo_disruption_delay_seconds=int(_get_env("DEMO_DISRUPTION_DELAY_SECONDS", "12")),
        demo_disruption_city=_get_env("DEMO_DISRUPTION_CITY", "Chennai"),
        demo_disruption_severity=float(_get_env("DEMO_DISRUPTION_SEVERITY", "0.82")),
    )


settings = load_settings()

# Explicit demo flag for fast, deterministic startup
DEMO_MODE = settings.demo_mode
