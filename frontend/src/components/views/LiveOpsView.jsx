import { useMemo, useState } from "react";
import { MetricCard, Panel, ProgressBar } from "../common/UiPrimitives";

function getMetricTone(metric, value) {
  switch (metric) {
    case "on_time":
      if (value >= 95) return "good";
      if (value >= 85) return "warning";
      return "danger";
    case "utilization":
      if (value < 70) return "good";
      if (value < 90) return "warning";
      return "danger";
    case "idle":
      return value > 0 ? "good" : "warning";
    default:
      return "steel";
  }
}

export function LiveOpsView({
  metrics,
  criticalFacilities,
  dashboard,
  deferredVehicles,
  objectiveLookup,
  decisions,
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [expandedAlert, setExpandedAlert] = useState(null);

  // Calculate vehicle status distribution for donut chart
  const vehicleStatusDistribution = useMemo(() => {
    if (!deferredVehicles) return {};
    const distribution = {
      idle: 0,
      loading: 0,
      unloading: 0,
      in_transit: 0,
      waiting: 0,
      resting: 0,
      offline: 0,
    };
    deferredVehicles.forEach((vehicle) => {
      if (distribution[vehicle.status] !== undefined) {
        distribution[vehicle.status]++;
      }
    });
    return distribution;
  }, [deferredVehicles]);

  // Get selected vehicle details
  const selectedVehicle = selectedVehicleId
    ? deferredVehicles.find((v) => v.vehicle_id === selectedVehicleId)
    : null;

  // Filter recommendations and decisions for selected vehicle
  const vehicleRecommendations = selectedVehicleId
    ? (dashboard?.alerts ?? []).filter((alert) => alert.vehicle_id === selectedVehicleId)
    : [];

  const vehicleDecisions = selectedVehicleId
    ? (decisions ?? []).filter((d) => d.vehicle_id === selectedVehicleId).slice(0, 3)
    : [];

  // Create critical alerts from dashboard data and metrics
  const criticalAlerts = useMemo(() => {
    const alerts = [];

    // Facility capacity alerts
    (criticalFacilities ?? []).forEach((facility) => {
      if (facility.utilization_pct >= 90) {
        alerts.push({
          id: `capacity-${facility.facility_id}`,
          type: "capacity",
          severity: "critical",
          title: "Critical Capacity Alert",
          description: `${facility.facility_name} is at ${facility.utilization_pct.toFixed(1)}% capacity`,
          detail: `${facility.effective_available_units} units remaining`,
          timestamp: new Date().toISOString(),
        });
      } else if (facility.utilization_pct >= 80) {
        alerts.push({
          id: `capacity-${facility.facility_id}`,
          type: "capacity",
          severity: "warning",
          title: "Capacity Warning",
          description: `${facility.facility_name} approaching capacity at ${facility.utilization_pct.toFixed(1)}%`,
          detail: `${facility.effective_available_units} units remaining`,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Port spillover alerts
    if (dashboard?.simulation?.spillover_active) {
      alerts.push({
        id: "spillover-active",
        type: "spillover",
        severity: "critical",
        title: "Port Spillover Active",
        description: "Active port spillover detected - manual intervention may be needed",
        detail: dashboard?.simulation?.spillover_message ?? "Monitor closely",
        timestamp: new Date().toISOString(),
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [criticalFacilities, dashboard?.simulation]);

  // Get recent recommendations (last 20)
  const recentRecommendations = useMemo(() => {
    return (dashboard?.alerts ?? []).slice(0, 20);
  }, [dashboard?.alerts]);

  const totalVehicles = Object.values(vehicleStatusDistribution).reduce((a, b) => a + b, 0);
  const statusLabels = Object.entries(vehicleStatusDistribution).map(([status, count]) => `${status}: ${count}`);

  return (
    <section className="ops-layout">
      {/* Simulation Status Bar */}
      <Panel title="Simulation Control">
        <div className="status-bar">
          <div className="status-info">
            <span className="status-label">Status:</span>
            <span className={`status-badge ${dashboard?.simulation?.state ?? "idle"}`}>
              {dashboard?.simulation?.state?.toUpperCase() ?? "IDLE"}
            </span>
          </div>
          <div className="status-info">
            <span className="status-label">Sim Time:</span>
            <span className="status-value">
              {dashboard?.simulation?.simulation_time?.slice(0, 19).replace("T", " ") ?? "loading"}
            </span>
          </div>
          <div className="status-info">
            <span className="status-label">Speed:</span>
            <span className="status-value">{dashboard?.simulation?.speed_multiplier ?? 0}x</span>
          </div>
          <div className="status-info">
            <span className="status-label">Queued Events:</span>
            <span className="status-value">{dashboard?.simulation?.queued_events ?? 0}</span>
          </div>
        </div>
      </Panel>

      {/* Key Metrics Row - Enhanced */}
      <div className="metrics-row">
        <MetricCard
          label="On-Time Delivery %"
          value={`${Number(metrics?.on_time_delivery_pct ?? 0).toFixed(1)}%`}
          tone={getMetricTone("on_time", metrics?.on_time_delivery_pct ?? 0)}
        />
        <MetricCard
          label="Stockouts Prevented"
          value={metrics?.stockouts_prevented ?? 0}
          tone="amber"
        />
        <MetricCard
          label="CO2 Saved (kg)"
          value={`${Number(metrics?.co2_saved_kg ?? 0).toFixed(0)}`}
          tone="teal"
        />
        <MetricCard
          label="Idle Time Prevented (hrs)"
          value={`${Number(metrics?.idle_minutes_prevented ?? 0 / 60).toFixed(1)}`}
          tone="steel"
        />
        <MetricCard
          label="Avg Utilization %"
          value={`${Number(metrics?.warehouse_utilization_pct ?? 0).toFixed(1)}%`}
          tone={getMetricTone("utilization", metrics?.warehouse_utilization_pct ?? 0)}
        />
        <MetricCard
          label="Critical Deliveries Saved"
          value={metrics?.critical_deliveries_saved ?? 0}
          tone="coral"
        />
      </div>

      {/* Facility Load Summary & Vehicle Status Overview */}
      <div className="grid-two">
        <Panel title="Facility Load Summary">
          {criticalFacilities.length === 0 ? (
            <div className="empty">No facility is above 70% utilization right now.</div>
          ) : (
            <div className="facility-stack">
              {criticalFacilities.map((facility) => {
                const utilizationTone =
                  facility.utilization_pct >= 90 ? "danger" : facility.utilization_pct >= 70 ? "warning" : "good";
                return (
                  <div className="util-card" key={facility.facility_id}>
                    <div className="util-head">
                      <strong>{facility.facility_name}</strong>
                      <span className={`util-badge ${utilizationTone}`}>
                        {facility.utilization_pct.toFixed(1)}%
                      </span>
                    </div>
                    <ProgressBar value={facility.utilization_pct} />
                    <div className="util-foot">
                      <span>{facility.city}</span>
                      <span>{facility.effective_available_units} units free</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Vehicle Status Overview">
          <div className="status-overview">
            <div className="status-chart">
              <div className="donut-label">
                <span className="total">{totalVehicles}</span>
                <span className="label">Total Vehicles</span>
              </div>
              <div className="status-legend">
                {Object.entries(vehicleStatusDistribution).map(([status, count]) => (
                  <div key={status} className="legend-item">
                    <span className={`legend-dot ${status}`}></span>
                    <span>{status}: {count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Vehicle List with Detail Panel */}
      <div className="grid-two">
        <Panel title="Active Vehicles">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Progress</th>
                  <th>Payload</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {deferredVehicles.slice(0, 15).map((vehicle) => {
                  const isSelected = selectedVehicleId === vehicle.vehicle_id;
                  const statusTone =
                    vehicle.status === "in_transit" && vehicle.progress_pct >= 80
                      ? "warning"
                      : vehicle.status === "delayed"
                        ? "danger"
                        : "good";

                  return (
                    <tr
                      key={vehicle.vehicle_id}
                      onClick={() => setSelectedVehicleId(isSelected ? null : vehicle.vehicle_id)}
                      className={isSelected ? "selected" : ""}
                    >
                      <td>{vehicle.identifier}</td>
                      <td>{vehicle.driver_name ?? "Unassigned"}</td>
                      <td>
                        <span className={`status-badge ${vehicle.status}`}>{vehicle.status}</span>
                      </td>
                      <td>{vehicle.facility_name ?? "-"}</td>
                      <td>
                        <ProgressBar value={vehicle.progress_pct} compact />
                      </td>
                      <td>{vehicle.payload_units}u</td>
                      <td>{vehicle.eta ? vehicle.eta.slice(0, 16).replace("T", " ") : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {selectedVehicle ? (
          <Panel title={`Vehicle Detail: ${selectedVehicle.identifier}`}>
            <div className="detail-panel">
              <div className="detail-section">
                <h4>Current State</h4>
                <div className="detail-grid">
                  <span className="label">Current Facility:</span>
                  <span className="value">{selectedVehicle.facility_name}</span>
                  <span className="label">Objective:</span>
                  <span className="value">
                    {objectiveLookup[selectedVehicle.objective_id]?.name ?? "Unassigned"}
                  </span>
                  <span className="label">Payload:</span>
                  <span className="value">{selectedVehicle.payload_units} units</span>
                  <span className="label">Progress:</span>
                  <ProgressBar value={selectedVehicle.progress_pct} compact />
                </div>
              </div>

              {selectedVehicle.status === "in_transit" && (
                <div className="detail-section">
                  <h4>Route Progress</h4>
                  <ProgressBar value={selectedVehicle.progress_pct} />
                  <div className="route-info">
                    <span>Origin → Destination</span>
                    <span className="eta">ETA: {selectedVehicle.eta?.slice(0, 16).replace("T", " ") ?? "-"}</span>
                  </div>
                </div>
              )}

              {vehicleRecommendations.length > 0 && (
                <div className="detail-section">
                  <h4>Recent Recommendations</h4>
                  <div className="recommendation-stack">
                    {vehicleRecommendations.slice(0, 3).map((rec) => (
                      <div key={rec.id} className="rec-card">
                        <div className="rec-head">
                          <span className={`status-badge ${rec.status ?? "pending"}`}>{rec.status ?? "pending"}</span>
                          <span className="confidence">{Number(rec.confidence ?? 0).toFixed(0)}% confidence</span>
                        </div>
                        <p className="rec-action">{rec.action_description ?? rec.recommendation_type}</p>
                        <small>{rec.reason ?? "No reason provided"}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {vehicleDecisions.length > 0 && (
                <div className="detail-section">
                  <h4>Decision History</h4>
                  <div className="decision-stack">
                    {vehicleDecisions.map((decision) => (
                      <div key={decision.id} className="decision-item">
                        <span className={`decision-badge ${decision.decision}`}>{decision.decision}</span>
                        <span className="outcome">
                          {decision.rating_delta > 0 ? "↑ Better" : decision.rating_delta < 0 ? "↓ Worse" : "→ Neutral"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        ) : (
          <Panel title="Vehicle Details">
            <div className="empty">Select a vehicle to view details</div>
          </Panel>
        )}
      </div>

      {/* Critical Alerts Section */}
      <Panel title={`Critical Alerts (${criticalAlerts.length})`}>
        {criticalAlerts.length === 0 ? (
          <div className="empty">No critical alerts at this time.</div>
        ) : (
          <div className="alerts-stack">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className={`alert-card ${alert.severity}`}>
                <div className="alert-head">
                  <strong>{alert.title}</strong>
                  <span className={`alert-badge ${alert.severity}`}>{alert.severity.toUpperCase()}</span>
                </div>
                <p className="alert-description">{alert.description}</p>
                <small className="alert-detail">{alert.detail}</small>
                <div className="alert-time">{new Date(alert.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Recommendations & Decisions Log */}
      <Panel title={`Recent AI Recommendations (${recentRecommendations.length})`}>
        {recentRecommendations.length === 0 ? (
          <div className="empty">No recommendations yet.</div>
        ) : (
          <div className="recommendations-stack">
            {recentRecommendations.map((rec) => (
              <div key={rec.id} className="recommendation-card">
                <div className="rec-header">
                  <span className="rec-id">#{rec.id}</span>
                  <span className={`status-badge ${rec.status ?? "pending"}`}>{rec.status ?? "pending"}</span>
                  <span className="confidence">{Number(rec.confidence ?? 0).toFixed(0)}% confident</span>
                </div>
                <div className="rec-body">
                  <div className="vehicle-info">
                    <strong>Vehicle:</strong> {rec.vehicle_identifier ?? "Unknown"}
                  </div>
                  <div className="action-info">
                    <strong>Recommendation:</strong> {rec.action_description ?? rec.recommendation_type ?? "N/A"}
                  </div>
                  <div className="reason-info">
                    <strong>Reason:</strong> {rec.reason ?? "No reason provided"}
                  </div>
                  {rec.driver_name && (
                    <div className="driver-info">
                      <strong>Driver:</strong> {rec.driver_name} (Rating: {Number(rec.driver_rating ?? 0).toFixed(2)})
                    </div>
                  )}
                </div>
                <div className="rec-footer">
                  <small>{new Date(rec.created_at ?? new Date()).toLocaleTimeString()}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Active Event Feed */}
      <Panel title="Active Event Feed">
        <div className="event-stack">
          {(dashboard?.active_events ?? []).map((event, idx) => (
            <div className="event-card" key={`${event.city}-${event.kind}-${idx}`}>
              <div className="event-top">
                <strong>{event.city}</strong>
                <span className={`event-type ${event.kind}`}>{event.kind}</span>
              </div>
              <p>{event.headline}</p>
              <small>
                {event.impact_type} • impact {Number(event.impact_score).toFixed(2)}
              </small>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}
