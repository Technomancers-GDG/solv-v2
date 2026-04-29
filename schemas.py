from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class FacilityBase(BaseModel):
    name: str
    city: str
    facility_type: str = Field(pattern="^(warehouse|port)$")
    latitude: float
    longitude: float
    base_capacity_units: int
    current_inventory_units: int = 0
    initial_inventory_units: int = 0
    queue_capacity_units: int = 0
    active: bool = True


class FacilityCreate(FacilityBase):
    pass


class FacilityUpdate(BaseModel):
    name: str | None = None
    city: str | None = None
    base_capacity_units: int | None = None
    current_inventory_units: int | None = None
    initial_inventory_units: int | None = None
    queue_capacity_units: int | None = None
    active: bool | None = None


class FacilityRead(FacilityBase, ORMModel):
    id: int
    created_at: datetime
    updated_at: datetime


class PortLinkBase(BaseModel):
    warehouse_id: int
    port_id: int
    reserved_capacity_units: int = 0
    spillover_threshold_pct: float = 80.0
    max_spillover_units: int = 0
    active: bool = True


class PortLinkCreate(PortLinkBase):
    pass


class PortLinkRead(PortLinkBase, ORMModel):
    id: int


class DriverProfileBase(BaseModel):
    name: str
    override_rating: float = 1.0
    confidence: float = 0.5
    accept_recommendation_bias: float = 0.5
    active: bool = True


class DriverProfileCreate(DriverProfileBase):
    pass


class DriverProfileRead(DriverProfileBase, ORMModel):
    id: int


class VehicleBase(BaseModel):
    identifier: str
    vehicle_type: str = "truck"
    payload_capacity_units: int
    home_facility_id: int
    current_facility_id: int | None = None
    driver_profile_id: int
    default_objective_id: int | None = None
    average_speed_kmph: float = 48.0
    emission_kg_per_km: float = 1.6
    rest_every_hours: float = 8.0
    rest_duration_minutes: int = 45
    status: str = "idle"


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    current_facility_id: int | None = None
    default_objective_id: int | None = None
    status: str | None = None


class VehicleRead(VehicleBase, ORMModel):
    id: int
    available_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ObjectiveBase(BaseModel):
    name: str
    commodity: str
    origin_facility_id: int
    destination_facility_id: int
    dispatch_interval_minutes: int = 120
    loading_duration_minutes: int = 30
    unloading_duration_minutes: int = 35
    sla_minutes: int = 720
    priority: int = 1
    assigned_vehicle_ids: list[int] = Field(default_factory=list)
    fallback_facility_ids: list[int] = Field(default_factory=list)
    active: bool = True


class ObjectiveCreate(ObjectiveBase):
    pass


class ObjectiveUpdate(BaseModel):
    assigned_vehicle_ids: list[int] | None = None
    fallback_facility_ids: list[int] | None = None
    dispatch_interval_minutes: int | None = None
    loading_duration_minutes: int | None = None
    unloading_duration_minutes: int | None = None
    sla_minutes: int | None = None
    priority: int | None = None
    active: bool | None = None


class ObjectiveRead(ObjectiveBase, ORMModel):
    id: int
    created_at: datetime
    updated_at: datetime


class RouteTemplateRead(ORMModel):
    id: int
    route_key: str
    origin_facility_id: int
    destination_facility_id: int
    distance_km: float
    duration_minutes: float
    encoded_polyline: str
    steps: list[dict[str, Any]]
    source: str
    refreshed_at: datetime


class RecommendationRead(ORMModel):
    id: int
    created_at: datetime
    simulation_time: datetime
    vehicle_id: int
    objective_id: int
    current_facility_id: int | None
    original_destination_id: int
    recommended_destination_id: int | None
    action: str
    explanation: str
    score_breakdown: dict[str, Any]
    baseline_cost: float
    recommended_cost: float
    financial_impact_usd: float
    status: str
    confidence: float | None = None


class DriverDecisionRead(ORMModel):
    id: int
    decided_at: datetime
    recommendation_id: int
    driver_profile_id: int
    vehicle_id: int
    decision: str
    actual_trip_cost: float
    recommended_trip_cost: float
    rating_delta: float
    note: str


class NewsEventRead(ORMModel):
    id: int
    original_date: date
    simulation_date: date
    city: str
    category: str
    headline: str
    relevant: bool
    impact_type: str
    impact_score: float
    model_probability: float


class WeatherEventRead(ORMModel):
    id: int
    original_date: date
    simulation_date: date
    city: str
    max_temp_c: float
    min_temp_c: float
    precipitation_mm: float
    closure_risk: float
    eta_multiplier: float


class ImportSummary(BaseModel):
    news_imported: int = 0
    weather_imported: int = 0
    news_model_accuracy: float | None = None
    validation_samples: int | None = None


class SimulationControlRequest(BaseModel):
    speed_multiplier: float | None = None


class SimulationStatus(BaseModel):
    status: str
    simulation_time: datetime
    speed_multiplier: float
    queued_events: int
    error_message: str | None = None


class FleetScaleRequest(BaseModel):
    target_vehicle_count: int = Field(default=80, ge=12, le=2000)
    reset_simulation: bool = True
    auto_start: bool = True
    speed_multiplier: float = 180.0


class FleetScaleResult(BaseModel):
    previous_vehicle_count: int
    new_vehicle_count: int
    created_vehicles: int
    previous_driver_count: int
    new_driver_count: int
    created_drivers: int
    objective_assignment_counts: dict[str, int]
    simulation: SimulationStatus


class FacilityLoadView(BaseModel):
    facility_id: int
    facility_name: str
    facility_type: str
    city: str
    utilization_pct: float
    effective_available_units: int
    queue_capacity_units: int
    current_inventory_units: int


class VehicleStateView(BaseModel):
    vehicle_id: int
    identifier: str
    status: str
    objective_id: int | None
    current_facility_id: int | None
    next_facility_id: int | None
    progress_pct: float
    eta: datetime | None
    payload_units: int
    recommendation_action: str | None = None


class MetricsSnapshotRead(ORMModel):
    id: int
    captured_at: datetime
    co2_saved_kg: float
    idle_minutes_prevented: float
    on_time_delivery_pct: float
    warehouse_utilization_pct: float
    reroute_count: int
    active_trucks: int
    queued_trucks: int
    financial_costs_saved_usd: float
    financial_costs_incurred_usd: float
    stockouts_prevented: int = 0
    critical_deliveries_saved: int = 0
    beneficiary_locations_served: int = 0
    spoilage_or_wastage_prevented: int = 0


class MetricsSummary(BaseModel):
    co2_saved_kg: float
    idle_minutes_prevented: float
    on_time_delivery_pct: float
    warehouse_utilization_pct: float
    reroute_count: int
    active_trucks: int
    queued_trucks: int
    financial_costs_saved_usd: float = 0.0
    financial_costs_incurred_usd: float = 0.0
    stockouts_prevented: int = 0
    critical_deliveries_saved: int = 0
    beneficiary_locations_served: int = 0
    spoilage_or_wastage_prevented: int = 0


class DashboardSnapshot(BaseModel):
    simulation: SimulationStatus
    facilities: list[FacilityLoadView]
    vehicles: list[VehicleStateView]
    alerts: list[RecommendationRead]
    metrics: MetricsSummary
    active_events: list[dict[str, Any]]


class ScenarioPresetRead(ORMModel):
    id: int
    scenario_key: str
    name: str
    description: str
    event_city: str
    event_type: str
    severity: float
    eta_multiplier: float
    inventory_pressure_pct: float
    active: bool


class ScenarioComparisonMetrics(BaseModel):
    on_time_delivery_pct: float
    average_delay_minutes: float
    overflow_events: int
    reroute_count: int
    idle_minutes_prevented: float
    co2_saved_kg: float
    stockouts_prevented: int


class ScenarioComparisonRead(BaseModel):
    scenario_key: str
    scenario_name: str
    baseline: ScenarioComparisonMetrics
    ai: ScenarioComparisonMetrics
    improvement_summary: dict[str, float]


class DriverInstructionRead(BaseModel):
    recommendation_id: int
    created_at: datetime
    vehicle_id: int
    vehicle_identifier: str
    objective_name: str
    action: str
    explanation: str
    status: str


class DriverResponseRequest(BaseModel):
    recommendation_id: int
    decision: str = Field(pattern="^(accepted|ignored)$")
    note: str = ""


class RecommendationDecisionRequest(BaseModel):
    decision: str = Field(pattern="^(accept|ignore)$")


class DriverIncidentCreate(BaseModel):
    driver_profile_id: int
    vehicle_id: int | None = None
    city: str
    incident_type: str
    severity: float = 0.6
    note: str = ""


class DriverIncidentRead(ORMModel):
    id: int
    reported_at: datetime
    driver_profile_id: int
    vehicle_id: int | None
    city: str
    incident_type: str
    severity: float
    note: str
    linked_news_event_id: int | None


class DriverMobileSnapshot(BaseModel):
    driver_id: int
    driver_name: str
    override_rating: float
    confidence: float
    pending_instructions: list[DriverInstructionRead]
    recent_incidents: list[DriverIncidentRead]


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


class RiskForecastRead(BaseModel):
    city: str
    risk: float
    eta_multiplier: float
    closure_risk: float
    confidence: float
    factors: list[str]
    forecast_time: str
    prediction_interval: list[float] | None = None
    trend: str | None = None


class BlockchainBlockRead(BaseModel):
    index: int
    timestamp: str
    decision_type: str
    entity_id: int
    action: str
    explanation: str
    previous_hash: str
    metadata: dict[str, Any]
    nonce: int
    hash: str | None = None


class BlockchainVerifyRead(BaseModel):
    valid: bool
    block_count: int
    tampered_indices: list[int]
    last_block_hash: str | None


class InventoryForecastRead(BaseModel):
    facility_id: int
    facility_name: str
    predicted_demand_units: int
    safety_stock_units: int
    reorder_point: int
    recommended_dispatch_count: int
    confidence: float
    forecast_period_hours: int
    trend: str


class ProactiveDispatchRead(BaseModel):
    origin_facility_id: int
    destination_facility_id: int
    recommended_units: int
    urgency: str
    reason: str
    eta_hours: float


class EdgeSyncStatusRead(BaseModel):
    driver_profile_id: int
    pending_operations: list[dict[str, Any]]
    last_sync_at: str | None
    offline_since: str | None
    cached_routes: list[dict[str, Any]]
    cached_recommendations: list[dict[str, Any]]
    pending_count: int


class CloudHealthRead(BaseModel):
    firebase_rtdb: dict[str, Any]
    pubsub: dict[str, Any]
    vertex_ai: dict[str, Any]
    bigquery: dict[str, Any]
    fcm: dict[str, Any]
    overall: str


class ParetoFrontRead(BaseModel):
    objectives: list[float]
    genome: list[dict[str, Any]]
    rank: int
    crowding_distance: float


NodeType = Literal["warehouse", "port", "railhead", "mine"]
TransportMode = Literal["road", "rail", "water"]


class LogisticsNodeInput(BaseModel):
    id: str = Field(min_length=1)
    name: str
    node_type: NodeType
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    capacity_units: int | None = Field(default=None, ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)
    active: bool = True


class LogisticsEdgeInput(BaseModel):
    id: str | None = None
    from_node_id: str = Field(min_length=1)
    to_node_id: str = Field(min_length=1)
    transport_mode: TransportMode
    cost: float = Field(ge=0)
    time: float = Field(ge=0, description="Transit time in minutes")
    risk: float = Field(ge=0, le=1)
    capacity: float | None = Field(default=None, ge=0)
    time_window: tuple[float, float] | None = Field(
        default=None,
        description="Allowed traversal window in minutes from route start.",
    )
    mode_switch_penalty: float = Field(default=0.0, ge=0)
    distance_km: float | None = Field(default=None, ge=0)
    capacity_units: int | None = Field(default=None, ge=0)
    bidirectional: bool = True
    constraints: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)
    active: bool = True


class LogisticsGraph(BaseModel):
    nodes: list[LogisticsNodeInput] = Field(default_factory=list)
    edges: list[LogisticsEdgeInput] = Field(default_factory=list)
    constraints: dict[str, Any] = Field(default_factory=dict)


class DataFusionRequest(LogisticsGraph):
    persist: bool = False


class DataFusionResponse(LogisticsGraph):
    node_count: int
    edge_count: int


class RouteWeights(BaseModel):
    w1: float = Field(default=1.0, ge=0, description="Cost weight")
    w2: float = Field(default=1.0, ge=0, description="Time weight")
    w3: float = Field(default=1.0, ge=0, description="Risk weight")


class RouteBusinessMetrics(BaseModel):
    cost: float
    time: float
    risk: float
    fuel_estimate: float
    co2_estimate: float
    cost_savings_vs_baseline: float
    time_saved_vs_baseline: float


class RouteSegmentRead(BaseModel):
    edge_id: str
    from_node_id: str
    to_node_id: str
    transport_mode: TransportMode
    cost: float
    time: float
    risk: float
    base_cost: float | None = None
    base_time: float | None = None
    base_risk: float | None = None
    predicted_delay: float = 0.0
    risk_penalty: float = 0.0
    mode_switch_penalty_applied: float = 0.0
    switching_delay_applied: float = 0.0
    time_window_violation_minutes: float = 0.0
    capacity: float | None = None
    time_window: tuple[float, float] | None = None
    distance_km: float | None = None
    reversed: bool = False


class RouteOptionRead(BaseModel):
    route_id: int | None = None
    node_sequence: list[str]
    edge_sequence: list[str]
    segments: list[RouteSegmentRead]
    transport_modes: list[TransportMode]
    total_cost: float
    total_time: float
    total_risk: float
    score: float
    summary: str
    business_metrics: RouteBusinessMetrics | None = None


class ComputeRoutesRequest(BaseModel):
    origin_node_id: str
    destination_node_id: str
    graph: LogisticsGraph | None = None
    weights: RouteWeights = Field(default_factory=RouteWeights)
    max_routes: int = Field(default=3, ge=1, le=8)
    persist_graph: bool = False
    required_capacity: float = Field(default=0.0, ge=0)
    switching_delay: float = Field(default=0.0, ge=0)
    time_window_penalty: float = Field(default=10.0, ge=0)
    prediction_enabled: bool = True
    delay_penalty_per_minute: float = Field(default=1.0, ge=0)
    risk_penalty_factor: float = Field(default=500.0, ge=0)
    port_context: dict[str, Any] = Field(default_factory=dict)
    rail_context: dict[str, Any] = Field(default_factory=dict)
    weather_context: dict[str, Any] = Field(default_factory=dict)
    shipment_context: dict[str, Any] = Field(default_factory=dict)


class ComputeRoutesResponse(BaseModel):
    graph: LogisticsGraph
    adjusted_graph: LogisticsGraph | None = None
    shortest_path: RouteOptionRead
    alternatives: list[RouteOptionRead]
    constraints: dict[str, Any] = Field(default_factory=dict)
    predictions: PredictionResponse | None = None


class PortDelayPrediction(BaseModel):
    node_id: str
    delay_minutes: float
    confidence: float
    severity: str
    factors: list[str]


class RakeAvailabilityPrediction(BaseModel):
    node_id: str
    available_rakes: int
    wait_minutes: float
    confidence: float
    status: str


class RouteRiskPrediction(BaseModel):
    route_index: int
    route_signature: str
    risk: float
    predicted_delay_minutes: float
    confidence: float
    factors: list[str]


class PredictionRequest(BaseModel):
    graph: LogisticsGraph | None = None
    route_options: list[RouteOptionRead] = Field(default_factory=list)
    origin_node_id: str | None = None
    destination_node_id: str | None = None
    weights: RouteWeights = Field(default_factory=RouteWeights)
    max_routes: int = Field(default=3, ge=1, le=8)
    port_context: dict[str, Any] = Field(default_factory=dict)
    rail_context: dict[str, Any] = Field(default_factory=dict)
    weather_context: dict[str, Any] = Field(default_factory=dict)
    shipment_context: dict[str, Any] = Field(default_factory=dict)
    persist: bool = False


class PredictionResponse(BaseModel):
    generated_at: datetime
    port_delays: list[PortDelayPrediction]
    rake_availability: list[RakeAvailabilityPrediction]
    route_risks: list[RouteRiskPrediction]
    assumptions: list[str]


class DecisionRequest(BaseModel):
    route_options: list[RouteOptionRead] = Field(min_length=1)
    predictions: PredictionResponse
    delay_threshold_minutes: float = Field(default=120.0, ge=0)
    risk_threshold: float = Field(default=0.7, ge=0, le=1)


class DecisionResponse(BaseModel):
    recommended_route: RouteOptionRead
    alternatives: list[RouteOptionRead]
    reasoning: str
    switched: bool
    delay_exceeded: bool


class AssignRouteRequest(BaseModel):
    route: RouteOptionRead
    graph: LogisticsGraph | None = None
    shipment_id: int | None = None
    shipment_reference: str | None = None
    origin_node_id: str
    destination_node_id: str
    cargo_type: str = "general"
    quantity_units: int = Field(default=0, ge=0)
    driver_id: int | None = None
    vehicle_id: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AssignmentResponse(BaseModel):
    shipment_id: int
    shipment_reference: str
    route_id: int
    status: str
    assigned_driver_id: int | None
    assigned_vehicle_id: int | None
    route: RouteOptionRead


class RerouteRequest(BaseModel):
    shipment_id: int
    current_location_node_id: str | None = None
    destination_node_id: str | None = None
    graph: LogisticsGraph | None = None
    route_options: list[RouteOptionRead] = Field(default_factory=list)
    predictions: PredictionResponse | None = None
    weights: RouteWeights = Field(default_factory=RouteWeights)
    max_routes: int = Field(default=3, ge=1, le=8)
    delay_threshold_minutes: float = Field(default=120.0, ge=0)
    improvement_threshold: float = Field(default=50.0, ge=0)
    required_capacity: float = Field(default=0.0, ge=0)
    switching_delay: float = Field(default=0.0, ge=0)


class RerouteResponse(BaseModel):
    shipment_id: int
    previous_route: RouteOptionRead | None
    new_route: RouteOptionRead
    decision: DecisionResponse
    status: str
    rerouted: bool = True
    improvement_score: float = 0.0


class TelemetrySimulationRequest(BaseModel):
    route: RouteOptionRead
    shipment_id: int | None = None
    route_id: int | None = None
    payload_tons: float = Field(default=20.0, ge=0)


class TelemetrySimulationResponse(BaseModel):
    shipment_id: int | None
    route_id: int | None
    fuel_usage_liters: float
    delay_minutes: float
    emissions_kg: float
    generated_at: datetime
    details: dict[str, Any]
