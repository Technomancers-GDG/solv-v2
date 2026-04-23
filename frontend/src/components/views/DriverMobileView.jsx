import { useMemo, useState } from "react";
import { Input, Panel, Select } from "../common/UiPrimitives";

function getStatusTone(status) {
  const delayed = ["delayed", "late"];
  const atrisk = ["loading", "unloading", "waiting"];
  
  if (delayed.includes(status)) return "danger";
  if (atrisk.includes(status)) return "warning";
  return "good";
}

function formatDateTime(isoString) {
  if (!isoString) return "-";
  try {
    return new Date(isoString).toLocaleTimeString();
  } catch {
    return "-";
  }
}

function getRecommendationIcon(action) {
  const actionLower = action?.toLowerCase() || "";
  if (actionLower.includes("reroute")) return "📍";
  if (actionLower.includes("wait")) return "⏸";
  if (actionLower.includes("defer")) return "⏭";
  if (actionLower.includes("continue")) return "→";
  return "✓";
}

export function DriverMobileView({
  drivers,
  selectedDriverId,
  setSelectedDriverId,
  driverMobile,
  submitDriverMobileDecision,
  driverIncidentForm,
  setDriverIncidentForm,
  selectedDriverVehicles,
  handleDriverIncidentSubmit,
}) {
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [expandedInstructionId, setExpandedInstructionId] = useState(null);

  // Calculate vehicles assigned to selected driver
  const driverVehicleCount = useMemo(() => {
    if (!selectedDriverId) return 0;
    return selectedDriverVehicles.length;
  }, [selectedDriverVehicles]);

  // Get current vehicle info from driverMobile
  const currentVehicle = driverMobile?.current_vehicle_id
    ? { id: driverMobile.current_vehicle_id, identifier: driverMobile.vehicle_identifier }
    : null;

  // Get current objective info
  const currentObjective = driverMobile?.current_objective
    ? {
        origin: driverMobile.current_objective.origin_facility_name,
        destination: driverMobile.current_objective.destination_facility_name,
        commodity: driverMobile.current_objective.commodity,
        sla: driverMobile.current_objective.sla_minutes,
      }
    : null;

  const handleDriverChange = (value) => {
    setSelectedDriverId(value);
    setShowIncidentForm(false);
    setExpandedInstructionId(null);
  };

  return (
    <section className="driver-mobile-layout">
      {/* Driver Selection */}
      <Panel title="Driver Mobile View">
        <div className="driver-selector">
          <Select
            label="Select Driver"
            value={selectedDriverId}
            options={drivers.map((driver) => [
              String(driver.id),
              `${driver.name} (${driverVehicleCount} vehicles)`,
            ])}
            onChange={handleDriverChange}
          />
          {driverMobile && (
            <div className="driver-status">
              <span className="status-item">
                <strong>Status:</strong> {driverMobile.current_status || "idle"}
              </span>
              <span className="status-item">
                <strong>Pending:</strong> {driverMobile.pending_instructions?.length || 0} actions
              </span>
              <span className="status-item">
                <strong>Synced:</strong> ✓
              </span>
            </div>
          )}
        </div>
      </Panel>

      {driverMobile ? (
        <>
          {/* Driver Header with Current Assignment */}
          <Panel title="Current Assignment">
            <div className="driver-header">
              <div className="header-info">
                <h3>{driverMobile.driver_name}</h3>
                <div className="vehicle-info">
                  <span className="vehicle-id">{driverMobile.vehicle_identifier || "Unassigned"}</span>
                  <span className={`status-badge ${driverMobile.current_status}`}>
                    {driverMobile.current_status?.toUpperCase() || "IDLE"}
                  </span>
                </div>
              </div>
              <div className="header-stats">
                <div className="stat">
                  <span className="label">Confidence:</span>
                  <span className="value">{Math.round((driverMobile.confidence ?? 0) * 100)}%</span>
                </div>
                <div className="stat">
                  <span className="label">Override Rating:</span>
                  <span className="value">{(driverMobile.override_rating ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {currentObjective && (
              <div className="objective-card">
                <div className="objective-header">
                  <h4>Current Delivery</h4>
                  <span className={`priority-badge high`}>Active</span>
                </div>

                <div className="objective-content">
                  <div className="origin-destination">
                    <div className="location">
                      <span className="label">Origin</span>
                      <span className="name">{currentObjective.origin}</span>
                    </div>
                    <div className="arrow">→</div>
                    <div className="location">
                      <span className="label">Destination</span>
                      <span className="name">{currentObjective.destination}</span>
                    </div>
                  </div>

                  <div className="objective-meta">
                    <div className="meta-item">
                      <strong>Commodity:</strong> {currentObjective.commodity}
                    </div>
                    <div className="meta-item">
                      <strong>SLA:</strong> {currentObjective.sla} minutes
                    </div>
                    <div className="meta-item">
                      <strong>Progress:</strong>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${driverMobile.current_progress_pct ?? 0}%`,
                          }}
                        />
                      </div>
                      <span>{(driverMobile.current_progress_pct ?? 0).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Panel>

          {/* Pending Instructions */}
          <Panel title={`Pending Instructions (${driverMobile.pending_instructions?.length || 0})`}>
            {!driverMobile.pending_instructions || driverMobile.pending_instructions.length === 0 ? (
              <div className="empty">✓ No pending instructions. Keep driving!</div>
            ) : (
              <div className="instructions-stack">
                {driverMobile.pending_instructions.map((instruction) => {
                  const isExpanded = expandedInstructionId === instruction.recommendation_id;
                  return (
                    <div key={instruction.recommendation_id} className="instruction-card">
                      <div
                        className="instruction-header"
                        onClick={() =>
                          setExpandedInstructionId(isExpanded ? null : instruction.recommendation_id)
                        }
                      >
                        <div className="instruction-top">
                          <span className="icon">{getRecommendationIcon(instruction.action)}</span>
                          <div className="instruction-title">
                            <h4>{instruction.vehicle_identifier}</h4>
                            <span className="action-type">
                              {instruction.action.replaceAll("_", " ").toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>
                      </div>

                      {isExpanded && (
                        <div className="instruction-expanded">
                          <div className="explanation">
                            <p>{instruction.explanation}</p>
                          </div>

                          <div className="instruction-details">
                            <div className="detail-item">
                              <strong>Objective:</strong>
                              <span>{instruction.objective_name}</span>
                            </div>
                            <div className="detail-item">
                              <strong>Current Status:</strong>
                              <span className={`status ${instruction.vehicle_status || "idle"}`}>
                                {instruction.vehicle_status || "idle"}
                              </span>
                            </div>
                            {instruction.confidence && (
                              <div className="detail-item">
                                <strong>Confidence:</strong>
                                <span>{Math.round(instruction.confidence * 100)}%</span>
                              </div>
                            )}
                          </div>

                          <div className="instruction-actions">
                            <button
                              className="accept-btn"
                              onClick={() => {
                                submitDriverMobileDecision(
                                  instruction.recommendation_id,
                                  "accepted"
                                );
                                setExpandedInstructionId(null);
                              }}
                            >
                              ✓ Accept
                            </button>
                            <button
                              className="ignore-btn"
                              onClick={() => {
                                submitDriverMobileDecision(instruction.recommendation_id, "ignored");
                                setExpandedInstructionId(null);
                              }}
                            >
                              ✕ Ignore
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* Recent Status Updates */}
          <Panel title="Recent Status Updates">
            {!driverMobile.recent_status_updates || driverMobile.recent_status_updates.length === 0 ? (
              <div className="empty">No recent updates yet.</div>
            ) : (
              <div className="status-timeline">
                {driverMobile.recent_status_updates.slice(0, 5).map((update, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <p className="update-text">{update.message}</p>
                      <small className="update-time">
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Incident Reporting */}
          <Panel title="Report Issue">
            {!showIncidentForm ? (
              <button
                className="report-button"
                onClick={() => setShowIncidentForm(true)}
              >
                ⚠️ Report a Problem
              </button>
            ) : (
              <form className="incident-form" onSubmit={handleDriverIncidentSubmit}>
                <Select
                  label="Issue Type"
                  value={driverIncidentForm.incident_type}
                  options={[
                    ["road_blockage", "🚧 Road Blockage"],
                    ["strike", "✊ Strike"],
                    ["weather", "🌧️ Bad Weather"],
                    ["delay", "⏰ Unexpected Delay"],
                    ["port_congestion", "🚢 Port Congestion"],
                    ["other", "❓ Other"],
                  ]}
                  onChange={(value) =>
                    setDriverIncidentForm({ ...driverIncidentForm, incident_type: value })
                  }
                />

                <Input
                  label="City/Location"
                  value={driverIncidentForm.city}
                  onChange={(value) =>
                    setDriverIncidentForm({ ...driverIncidentForm, city: value })
                  }
                />

                <div className="severity-input">
                  <label>
                    <span>Severity (1-10)</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={Math.round(Number(driverIncidentForm.severity) * 10) || 5}
                      onChange={(e) =>
                        setDriverIncidentForm({
                          ...driverIncidentForm,
                          severity: String(Number(e.target.value) / 10),
                        })
                      }
                    />
                    <span className="severity-value">
                      {Math.round(Number(driverIncidentForm.severity) * 10)}/10
                    </span>
                  </label>
                </div>

                <Input
                  label="Additional Details"
                  value={driverIncidentForm.note}
                  onChange={(value) =>
                    setDriverIncidentForm({ ...driverIncidentForm, note: value })
                  }
                  required={false}
                />

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    Submit Report
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowIncidentForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </Panel>

          {/* Recent Incidents */}
          <Panel title="Recent Incidents">
            {!driverMobile.recent_incidents || driverMobile.recent_incidents.length === 0 ? (
              <div className="empty">No recent incidents reported.</div>
            ) : (
              <div className="incidents-stack">
                {driverMobile.recent_incidents.slice(0, 5).map((incident) => (
                  <div key={incident.id} className="incident-card">
                    <div className="incident-header">
                      <strong>{incident.city}</strong>
                      <span className={`incident-type-badge ${incident.incident_type}`}>
                        {incident.incident_type.replaceAll("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="incident-note">{incident.note || "No details provided"}</p>
                    <div className="incident-footer">
                      <span className="severity">
                        Severity: {(Number(incident.severity) * 10).toFixed(0)}/10
                      </span>
                      <small>{new Date(incident.created_at).toLocaleString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      ) : (
        <Panel title="Mobile View">
          <div className="empty">Select a driver to view mobile interface.</div>
        </Panel>
      )}
    </section>
  );
}
