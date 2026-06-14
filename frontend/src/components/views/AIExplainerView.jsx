import { useState, useEffect, useMemo } from "react";
import { Panel } from "../common/UiPrimitives";

function formatTimeOnly(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatCompact(n) {
  const v = Number(n) || 0;
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toFixed(2);
}

export function AIExplainerView({ apiFetch, recommendations, dashboard, vehicles, facilityLookup }) {
  const [selectedRecId, setSelectedRecId] = useState(null);
  const [aiActivity, setAiActivity] = useState(null);

  useEffect(() => {
    apiFetch("/api/metrics/ai-activity")
      .then(setAiActivity)
      .catch(() => {});
  }, [apiFetch]);

  const activeRecs = recommendations || [];
  const selectedRec = activeRecs.find(r => r.id === selectedRecId) || activeRecs[0];
  const metrics = dashboard?.metrics || {};
  const completedTrips = metrics.completed_trips ?? aiActivity?.completed_trips ?? 0;
  const totalDecisions = (aiActivity?.rl_engine?.train_step ?? 0) + activeRecs.length;

  const correctRate = useMemo(() => {
    if (aiActivity?.driver_acceptance_rate != null) return aiActivity.driver_acceptance_rate;
    if (aiActivity?.rl_sla_success_rate_pct != null) return aiActivity.rl_sla_success_rate_pct;
    return null;
  }, [aiActivity]);

  if (activeRecs.length === 0 && !aiActivity) {
    return <div className="loading">Awaiting AI decisions to explain...</div>;
  }

  return (
    <section className="analytics-layout explainer-view">
      <div className="view-header">
        <h2>Decision Explainability Engine</h2>
        <p>Transparent breakdown of the factors influencing AI rerouting and dispatch decisions.</p>
      </div>

      <div className="metrics-summary">
        <div className="metric-card">
          <span className="metric-label">AI Decisions Made</span>
          <span className="metric-value">{totalDecisions}</span>
          <span className="metric-unit">this session</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Reroutes Executed</span>
          <span className="metric-value">{metrics.reroute_count ?? aiActivity?.reroute_count ?? 0}</span>
          <span className="metric-unit">AI-optimized trips</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">CO₂ Saved</span>
          <span className="metric-value">{metrics.co2_saved_kg ? `${Math.round(metrics.co2_saved_kg)} kg` : "—"}</span>
          <span className="metric-unit">vs baseline routing</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Stockouts Prevented</span>
          <span className="metric-value">{metrics.stockouts_prevented ?? aiActivity?.stockouts_prevented ?? 0}</span>
          <span className="metric-unit">facilities saved</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Acceptance Rate</span>
          <span className="metric-value">{correctRate != null ? `${correctRate}%` : "—"}</span>
          <span className="metric-unit">driver / AI alignment</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">On-Time Delivery</span>
          <span className="metric-value">{metrics.on_time_delivery_pct != null ? `${metrics.on_time_delivery_pct}%` : "—"}</span>
          <span className="metric-unit">SLA compliance</span>
        </div>
      </div>

      <div className="explainer-content">
        <div className="rec-list">
          {activeRecs.length === 0 && (
            <div className="empty-state-rec">
              No recent recommendations — start the simulation to see AI decisions.
            </div>
          )}
          {activeRecs.map(rec => (
            <div
              key={rec.id}
              className={`rec-card ${selectedRec?.id === rec.id ? 'active' : ''}`}
              onClick={() => setSelectedRecId(rec.id)}
            >
              <div className="rec-card-top">
                <span className="rec-card-action">{(rec.action || "").replace(/_/g, " ").toUpperCase()}</span>
                <span className="rec-card-time">{formatTimeOnly(rec.simulation_time)}</span>
              </div>
              <div className="rec-card-excerpt">
                {rec.explanation}
              </div>
            </div>
          ))}
        </div>

        <div className="rec-details">
          {selectedRec ? (
            <div className="rec-details-stack">
              <Panel title={`Decision Detail: ${(selectedRec.action || "").replace(/_/g, " ").toUpperCase()}`}>
                <div className="panel-body-inner">
                  <h4 className="explainer-primary-header">Primary Explanation</h4>
                  <p className="explainer-primary-text">
                    {selectedRec.explanation}
                  </p>

                  <div className="explainer-detail-grid">
                    <div className="detail-section insight">
                      <h4>Key Insights</h4>
                      <ul>
                        {(selectedRec.structured_explanation?.insights || []).map((ins, i) => (
                          <li key={i}>{ins}</li>
                        ))}
                        {(!selectedRec.structured_explanation?.insights || selectedRec.structured_explanation.insights.length === 0) && (
                          <li>Standard operating procedure</li>
                        )}
                      </ul>
                    </div>

                    <div className="detail-section impact">
                      <h4>Predicted Impact</h4>
                      <ul>
                        {(selectedRec.structured_explanation?.impact || []).map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                        {(!selectedRec.structured_explanation?.impact || selectedRec.structured_explanation.impact.length === 0) && (
                          <li>Minimal deviation from baseline</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="detail-section counterfactual">
                    <h4>Counterfactual (What if we didn't intervene?)</h4>
                    <p>
                      {selectedRec.counterfactual || "If baseline was followed -> Expected normal operations."}
                    </p>
                  </div>
                </div>
              </Panel>

              <Panel title="Scoring Breakdown">
                <div className="panel-body-inner">
                  <div className="scoring-grid">
                    {Object.entries(selectedRec.score_breakdown || {}).map(([key, value]) => (
                      <div key={key} className="scoring-item">
                        <div className="scoring-label" title={key.replace(/_/g, ' ')}>
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="scoring-value">{typeof value === 'number' && !Number.isNaN(value) ? value.toFixed(3) : value ?? "—"}</div>
                      </div>
                    ))}
                    <div className="scoring-item total">
                        <div className="scoring-label">TOTAL SCORE</div>
                        <div className="scoring-value">{(selectedRec.recommended_cost ?? 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          ) : (
            <div className="select-empty-state">
              Select a decision to view explainability details.
            </div>
          )}
        </div>
      </div>

      {activeRecs.length > 0 && (
        <div className="outcome-tracker">
          <Panel title="Decision Outcome Tracker">
            <div className="panel-body-inner">
              <p className="outcome-intro">
                The last {Math.min(5, activeRecs.length)} AI decisions and their predicted vs actual outcomes.
              </p>
              <div className="outcome-table-wrap">
                <table className="outcome-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Baseline Cost</th>
                      <th>AI Cost</th>
                      <th>Savings</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecs.slice(0, 5).map((rec) => {
                      const savings = (rec.baseline_cost || 0) - (rec.recommended_cost || 0);
                      const accepted = rec.status === "accepted";
                      return (
                        <tr key={rec.id}>
                          <td>{formatTimeOnly(rec.simulation_time)}</td>
                          <td className="action-cell">{(rec.action || "").replace(/_/g, " ")}</td>
                          <td>₹{formatCompact(rec.baseline_cost || 0)}</td>
                          <td>₹{formatCompact(rec.recommended_cost || 0)}</td>
                          <td className={savings > 0 ? "savings-positive" : "savings-none"}>
                            {savings > 0 ? `₹${formatCompact(savings)}` : "—"}
                          </td>
                          <td>
                            <span className={`status-badge ${accepted ? "accepted" : rec.status === "ignored" ? "ignored" : "pending"}`}>
                              {accepted ? "✓ Accepted" : rec.status === "ignored" ? "✗ Ignored" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </section>
  );
}
