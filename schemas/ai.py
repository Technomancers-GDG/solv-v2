from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from schemas.core import ORMModel

class RLDecisionRequest(BaseModel):
    facility_utilization: float
    route_risk: float
    eta_multiplier: float
    sla_remaining_minutes: float
    sla_total_minutes: float
    payload_capacity: int
    facility_capacity: int
    priority: int
    port_pressure: float
    weather_severity: float
    news_severity: float
    simulation_hour: int
    valid_actions: list[str] | None = None


class RLDecisionResponse(BaseModel):
    action: str
    confidence: float
    action_probs: dict[str, float]
    engine: str = "dqn_numpy"

class AIChatRequest(BaseModel):
    query: str
    history: list[dict[str, str]] | None = None

class AIChatResponse(BaseModel):
    response: str
