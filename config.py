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


def _get_env(name: str, default: str) -> str:
    value = os.getenv(name)
    return value if value not in (None, "") else default


def load_settings() -> Settings:
    return Settings(
        app_name=_get_env("APP_NAME", "Intelligent Supply Chain Optimizer"),
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
        allow_demo_seed=_get_env("ALLOW_DEMO_SEED", "true").lower() in {"1", "true", "yes"},
    )


settings = load_settings()
