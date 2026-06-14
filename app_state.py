"""Centralized service instances shared across route modules."""
from __future__ import annotations

from config import settings
from services.driver_performance import DriverPerformanceService
from services.event_ingestion import EventIngestionService
from services.inventory_optimizer import InventoryOptimizer
from services.logistics_data_fusion import DataFusionService
from services.logistics_decision_engine import LogisticsDecisionEngine
from services.logistics_execution import LogisticsExecutionService
from services.logistics_prediction import LogisticsPredictionEngine
from services.logistics_telemetry import TelemetrySimulationService
from services.multi_objective_optimizer import NSGA2Optimizer
from services.multimodal_graph_engine import MultimodalGraphEngine
from services.news_relevance import NewsRelevanceService
from services.predictive_forecast import PredictiveForecastService
from services.rl_decision_engine import get_rl_engine
from services.route_planner import RoutePlanner
from services.simulation import SimulationEngine
from services.simulation_manager import simulation_manager

news_model = NewsRelevanceService()
route_planner = RoutePlanner()
event_ingestion_service = EventIngestionService(news_model)

# Demo/general engine (client_id=None, channel="global")
simulation_engine = SimulationEngine(route_planner, client_id=None, channel="global")
simulation_manager.register_engine(None, simulation_engine)

forecast_service = PredictiveForecastService()
inventory_optimizer = InventoryOptimizer()
data_fusion_service = DataFusionService()
multimodal_graph_engine = MultimodalGraphEngine()
logistics_prediction_engine = LogisticsPredictionEngine()
logistics_decision_engine = LogisticsDecisionEngine()
logistics_execution_service = LogisticsExecutionService()
telemetry_simulation_service = TelemetrySimulationService()
driver_performance_service = DriverPerformanceService(telemetry_simulation_service)
multi_objective_optimizer = NSGA2Optimizer()
