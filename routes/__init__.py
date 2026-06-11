from .crud import crud_router
from .simulation import simulation_router
from .driver import driver_router
from .ai import ai_router
from .logistics import logistics_router

__all__ = ["crud_router", "simulation_router", "driver_router", "ai_router", "logistics_router"]