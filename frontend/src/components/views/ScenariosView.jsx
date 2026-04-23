import { useMemo, useState } from "react";
import { Panel, Select } from "../common/UiPrimitives";

function getSeverityTone(severity) {
  if (severity >= 0.8) return "danger";
  if (severity >= 0.5) return "warning";
  return "good";
}

function formatDate(dateString) {
  if (!dateString) return "Never run";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "Unknown";
  }
}

function getImprovementColor(value) {
  if (value > 0) return "good";
  if (value < 0) return "danger";
  return "neutral";
}

export function ScenariosView({
  selectedScenarioKey,
  setSelectedScenarioKey,
  scenarios,
  selectedScenario,
  startScenarioFlow,
  triggerScenarioDisruption,
  compareScenario,
  scenarioComparison,
}) {
  const [expandedScenarioKey, setExpandedScenarioKey] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  // Calculate metrics improvements
  const improvements = useMemo(() => {
    if (!scenarioComparison) return null;

    const { baseline, ai } = scenarioComparison;
    return {
      onTimeDeliveryDelta: ai.on_time_delivery_pct - baseline.on_time_delivery_pct,
      onTimeDeliveryPctImprovement:
        baseline.on_time_delivery_pct !== 0
          ? ((ai.on_time_delivery_pct - baseline.on_time_delivery_pct) / baseline.on_time_delivery_pct) * 100
          : 0,
      delayReductionDelta: baseline.average_delay_minutes - ai.average_delay_minutes,
      overflowReduction: baseline.overflow_events - ai.overflow_events,
      reroutesPerformed: ai.reroute_count,
      idleMinutesPreventedDelta: ai.idle_minutes_prevented - baseline.idle_minutes_prevented,
      co2SavedDelta: ai.co2_saved_kg - baseline.co2_saved_kg,
      stockoutsPreventedDelta: ai.stockouts_prevented - baseline.stockouts_prevented,
    };
  }, [scenarioComparison]);

  const handleStartScenario = async () => {
    if (!selectedScenarioKey) return;
    await startScenarioFlow(selectedScenarioKey);
    setShowComparison(false);
  };

  const handleCompareScenario = async () => {
    if (!selectedScenarioKey) return;
    await compareScenario(selectedScenarioKey);
    setShowComparison(true);
  };

  return (
    <section className="scenarios-layout">
      {/* Scenario Presets Section */}
      <Panel title="Scenario Presets">
        <div className="scenarios-grid">
          {scenarios.map((scenario) => (
            <div
              key={scenario.scenario_key}
              className={`scenario-card ${selectedScenarioKey === scenario.scenario_key ? "selected" : ""}`}
              onClick={() => {
                setSelectedScenarioKey(scenario.scenario_key);
                setShowComparison(false);
              }}
            >
              <div className="scenario-header">
                <h3>{scenario.name}</h3>
                <span className={`severity-badge ${getSeverityTone(scenario.severity)}`}>
                  {(scenario.severity * 100).toFixed(0)}% impact
                </span>
              </div>

              <p className="scenario-description">{scenario.description}</p>

              <div className="scenario-meta">
                <span className="meta-item">
                  <strong>Location:</strong> {scenario.event_city}
                </span>
                <span className="meta-item">
                  <strong>Type:</strong> {scenario.event_type}
                </span>
                <span className="meta-item">
                  <strong>ETA Effect:</strong> {scenario.eta_multiplier.toFixed(2)}x
                </span>
              </div>

              {expandedScenarioKey === scenario.scenario_key && (
                <div className="scenario-expanded">
                  <div className="expanded-content">
                    <div className="detail-row">
                      <strong>Inventory Pressure:</strong>
                      <span>{(scenario.inventory_pressure_pct * 100).toFixed(1)}%</span>
                    </div>
                    <div className="detail-row">
                      <strong>Status:</strong>
                      <span>{scenario.active ? "Active" : "Inactive"}</span>
                    </div>
                  </div>

                  <div className="scenario-actions">
                    <button className="primary" onClick={() => handleStartScenario()}>
                      Start Scenario
                    </button>
                    <button onClick={() => handleCompareScenario()}>
                      View Comparison
                    </button>
                  </div>
                </div>
              )}

              <button
                className="expand-btn"
                onClick={() =>
                  setExpandedScenarioKey(expandedScenarioKey === scenario.scenario_key ? null : scenario.scenario_key)
                }
              >
                {expandedScenarioKey === scenario.scenario_key ? "▼ Hide" : "▶ Details"}
              </button>
            </div>
          ))}
        </div>
      </Panel>

      {/* Scenario Replay Controls */}
      {selectedScenario && (
        <Panel title={`Replay: ${selectedScenario.name}`}>
          <div className="scenario-controls">
            <div className="control-info">
              <p className="description">{selectedScenario.description}</p>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Location:</strong>
                  <span>{selectedScenario.event_city}</span>
                </div>
                <div className="info-item">
                  <strong>Event Type:</strong>
                  <span>{selectedScenario.event_type}</span>
                </div>
                <div className="info-item">
                  <strong>Severity:</strong>
                  <span className={`severity-badge ${getSeverityTone(selectedScenario.severity)}`}>
                    {(selectedScenario.severity * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="info-item">
                  <strong>ETA Multiplier:</strong>
                  <span>{selectedScenario.eta_multiplier.toFixed(2)}x</span>
                </div>
              </div>
            </div>

            <div className="control-buttons">
              <button className="primary" onClick={handleStartScenario}>
                🚀 Start Scenario at 180x Speed
              </button>
              <button onClick={() => triggerScenarioDisruption(selectedScenarioKey)}>
                ⚡ Trigger Disruption Now
              </button>
              <button onClick={handleCompareScenario}>
                📊 Compare With Baseline
              </button>
            </div>
          </div>
        </Panel>
      )}

      {/* Scenario Comparison Section */}
      {scenarioComparison && showComparison && (
        <Panel title={`Comparison: ${scenarioComparison.scenario_name}`}>
          <div className="comparison-layout">
            {/* Header */}
            <div className="comparison-header">
              <h3>{scenarioComparison.scenario_name}</h3>
              <p className="timestamp">Comparison generated at {new Date().toLocaleString()}</p>
              <button onClick={handleCompareScenario} className="small">
                ↻ Re-run Comparison
              </button>
            </div>

            {/* Metrics Comparison Table */}
            <div className="metrics-comparison">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Baseline (No AI)</th>
                    <th>With AI Rerouting</th>
                    <th>Improvement</th>
                    <th>% Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>On-Time Delivery %</strong>
                    </td>
                    <td>{scenarioComparison.baseline.on_time_delivery_pct.toFixed(1)}%</td>
                    <td>{scenarioComparison.ai.on_time_delivery_pct.toFixed(1)}%</td>
                    <td className={`improvement ${getImprovementColor(improvements.onTimeDeliveryDelta)}`}>
                      {improvements.onTimeDeliveryDelta > 0 ? "+" : ""}
                      {improvements.onTimeDeliveryDelta.toFixed(1)}%
                    </td>
                    <td className={`improvement ${getImprovementColor(improvements.onTimeDeliveryPctImprovement)}`}>
                      {improvements.onTimeDeliveryPctImprovement > 0 ? "+" : ""}
                      {improvements.onTimeDeliveryPctImprovement.toFixed(1)}%
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Average Delay (minutes)</strong>
                    </td>
                    <td>{scenarioComparison.baseline.average_delay_minutes.toFixed(1)}</td>
                    <td>{scenarioComparison.ai.average_delay_minutes.toFixed(1)}</td>
                    <td className={`improvement ${getImprovementColor(-improvements.delayReductionDelta)}`}>
                      {improvements.delayReductionDelta > 0 ? "-" : "+"}
                      {Math.abs(improvements.delayReductionDelta).toFixed(1)}
                    </td>
                    <td className={`improvement ${getImprovementColor(-improvements.delayReductionDelta)}`}>
                      {improvements.delayReductionDelta > 0 ? "-" : "+"}
                      {scenarioComparison.baseline.average_delay_minutes !== 0
                        ? ((improvements.delayReductionDelta / scenarioComparison.baseline.average_delay_minutes) * 100).toFixed(
                            1,
                          )
                        : "0"}
                      %
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Overflow Events</strong>
                    </td>
                    <td>{scenarioComparison.baseline.overflow_events}</td>
                    <td>{scenarioComparison.ai.overflow_events}</td>
                    <td className={`improvement ${getImprovementColor(-improvements.overflowReduction)}`}>
                      {improvements.overflowReduction > 0 ? "-" : "+"}
                      {Math.abs(improvements.overflowReduction)}
                    </td>
                    <td className={`improvement ${getImprovementColor(-improvements.overflowReduction)}`}>
                      {scenarioComparison.baseline.overflow_events !== 0
                        ? ((improvements.overflowReduction / scenarioComparison.baseline.overflow_events) * 100).toFixed(1)
                        : "0"}
                      %
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Reroute Count</strong>
                    </td>
                    <td>0</td>
                    <td>{scenarioComparison.ai.reroute_count}</td>
                    <td className="improvement good">+{scenarioComparison.ai.reroute_count}</td>
                    <td>N/A</td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Idle Time Prevented (hours)</strong>
                    </td>
                    <td>{(scenarioComparison.baseline.idle_minutes_prevented / 60).toFixed(1)}</td>
                    <td>{(scenarioComparison.ai.idle_minutes_prevented / 60).toFixed(1)}</td>
                    <td className={`improvement ${getImprovementColor(improvements.idleMinutesPreventedDelta)}`}>
                      {improvements.idleMinutesPreventedDelta > 0 ? "+" : ""}
                      {(improvements.idleMinutesPreventedDelta / 60).toFixed(1)}
                    </td>
                    <td className={`improvement ${getImprovementColor(improvements.idleMinutesPreventedDelta)}`}>
                      {scenarioComparison.baseline.idle_minutes_prevented !== 0
                        ? ((improvements.idleMinutesPreventedDelta / scenarioComparison.baseline.idle_minutes_prevented) * 100).toFixed(
                            1,
                          )
                        : "0"}
                      %
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>CO2 Saved (kg)</strong>
                    </td>
                    <td>{scenarioComparison.baseline.co2_saved_kg.toFixed(0)}</td>
                    <td>{scenarioComparison.ai.co2_saved_kg.toFixed(0)}</td>
                    <td className={`improvement ${getImprovementColor(improvements.co2SavedDelta)}`}>
                      {improvements.co2SavedDelta > 0 ? "+" : ""}
                      {improvements.co2SavedDelta.toFixed(0)}
                    </td>
                    <td className={`improvement ${getImprovementColor(improvements.co2SavedDelta)}`}>
                      {scenarioComparison.baseline.co2_saved_kg !== 0
                        ? ((improvements.co2SavedDelta / scenarioComparison.baseline.co2_saved_kg) * 100).toFixed(1)
                        : "0"}
                      %
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Stockouts Prevented</strong>
                    </td>
                    <td>{scenarioComparison.baseline.stockouts_prevented}</td>
                    <td>{scenarioComparison.ai.stockouts_prevented}</td>
                    <td className={`improvement ${getImprovementColor(improvements.stockoutsPreventedDelta)}`}>
                      {improvements.stockoutsPreventedDelta > 0 ? "+" : ""}
                      {improvements.stockoutsPreventedDelta}
                    </td>
                    <td>N/A</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Impact Summary Card */}
            <div className="impact-summary">
              <div className="summary-card good">
                <h4>✓ AI Impact Summary</h4>
                <p>
                  AI rerouting prevented <strong>{improvements.overflowReduction} overflow events</strong> and saved{" "}
                  <strong>{improvements.co2SavedDelta.toFixed(0)} kg CO2</strong> by optimally routing{" "}
                  <strong>{improvements.reroutesPerformed} vehicles</strong> around disruptions. On-time delivery improved
                  by <strong>{improvements.onTimeDeliveryDelta.toFixed(1)}%</strong>, and{" "}
                  <strong>{improvements.stockoutsPreventedDelta}</strong> critical stockouts were prevented.
                </p>
              </div>

              <div className="summary-card steel">
                <h4>📍 Beneficiary Locations Served</h4>
                <p>
                  Rerouting enabled critical deliveries to essential facilities in {scenarioComparison.scenario_name}.
                  Key beneficiaries included emergency distribution centers and medical supply hubs that would have faced
                  capacity constraints or stockouts under baseline operations.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Quick Comparison View (if comparison exists but not expanded) */}
      {scenarioComparison && !showComparison && (
        <Panel title="Latest Comparison Result">
          <div className="quick-comparison">
            <div className="quick-stat">
              <span className="label">On-Time Delivery Improvement</span>
              <span className={`value ${getImprovementColor(improvements.onTimeDeliveryDelta)}`}>
                {improvements.onTimeDeliveryDelta > 0 ? "+" : ""}
                {improvements.onTimeDeliveryDelta.toFixed(1)}%
              </span>
            </div>

            <div className="quick-stat">
              <span className="label">Overflow Events Prevented</span>
              <span className="value good">-{improvements.overflowReduction}</span>
            </div>

            <div className="quick-stat">
              <span className="label">CO2 Saved</span>
              <span className="value good">+{improvements.co2SavedDelta.toFixed(0)} kg</span>
            </div>

            <div className="quick-stat">
              <span className="label">Delay Reduction</span>
              <span className="value good">-{improvements.delayReductionDelta.toFixed(1)} min</span>
            </div>

            <button onClick={() => setShowComparison(true)} className="expand-comparison">
              View Full Comparison →
            </button>
          </div>
        </Panel>
      )}
    </section>
  );
}
