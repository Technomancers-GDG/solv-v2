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
    return <div className="loading" style={{textAlign: 'center', padding: '60px', color: 'var(--text-muted)'}}>Awaiting AI decisions to explain...</div>;
  }

  return (
    <section className="analytics-layout explainer-view">
      <div className="view-header" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Decision Explainability Engine</h2>
        <p style={{ color: "var(--text-muted)", fontSize: '1.1rem' }}>Transparent breakdown of the factors influencing AI rerouting and dispatch decisions.</p>
      </div>

      <div className="bento-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: 'var(--dark-panel)', padding: '24px', borderRadius: '20px', color: 'white' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>AI Decisions Made</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-lime-strong)' }}>{totalDecisions}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>this session</div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Reroutes Executed</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>{metrics.reroute_count ?? aiActivity?.reroute_count ?? 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>AI-optimized trips</div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>CO₂ Saved</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>{metrics.co2_saved_kg ? `${Math.round(metrics.co2_saved_kg)} kg` : "—"}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>vs baseline routing</div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Stockouts Prevented</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>{metrics.stockouts_prevented ?? aiActivity?.stockouts_prevented ?? 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>facilities saved</div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Acceptance Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>{correctRate != null ? `${correctRate}%` : "—"}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>driver / AI alignment</div>
        </div>
        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>On-Time Delivery</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#3b82f6' }}>{metrics.on_time_delivery_pct != null ? `${metrics.on_time_delivery_pct}%` : "—"}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>SLA compliance</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        <div className="rec-list" style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: "8px" }}>
          {activeRecs.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", background: "white", borderRadius: "20px", boxShadow: "var(--shadow-sm)" }}>
              No recent recommendations — start the simulation to see AI decisions.
            </div>
          )}
          {activeRecs.map(rec => (
            <div 
              key={rec.id} 
              style={{ 
                cursor: "pointer", 
                padding: "20px",
                borderRadius: "16px",
                transition: "all 0.2s",
                boxShadow: "var(--shadow-sm)",
                border: selectedRec?.id === rec.id ? "2px solid var(--accent-lime-strong)" : "none",
                backgroundColor: selectedRec?.id === rec.id ? "var(--dark-panel)" : "white",
                color: selectedRec?.id === rec.id ? "white" : "var(--text-main)"
              }}
              onClick={() => setSelectedRecId(rec.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: 800, fontSize: "1rem", color: selectedRec?.id === rec.id ? "var(--accent-lime-strong)" : "var(--text-main)" }}>{(rec.action || "").replace(/_/g, " ").toUpperCase()}</span>
                <span style={{ color: selectedRec?.id === rec.id ? "rgba(255,255,255,0.7)" : "var(--text-muted)", fontSize: "0.85rem", fontWeight: "600" }}>{formatTimeOnly(rec.simulation_time)}</span>
              </div>
              <div style={{ fontSize: "0.9rem", color: selectedRec?.id === rec.id ? "white" : "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.5" }}>
                {rec.explanation}
              </div>
            </div>
          ))}
        </div>

        <div className="rec-details">
          {selectedRec ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <Panel title={`Decision Detail: ${(selectedRec.action || "").replace(/_/g, " ").toUpperCase()}`}>
                <div>
                  <div style={{ background: "var(--bg-color)", padding: "24px", borderRadius: "16px", marginBottom: "24px" }}>
                    <h4 style={{ color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Primary Explanation</h4>
                    <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--text-main)", margin: 0, fontWeight: "500" }}>
                      {selectedRec.explanation}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                    <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", borderLeft: "4px solid #3b82f6", boxShadow: "var(--shadow-sm)" }}>
                      <h4 style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>Key Insights</h4>
                      <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-main)", display: "flex", flexDirection: "column", gap: "8px", fontWeight: "500" }}>
                        {(selectedRec.structured_explanation?.insights || []).map((ins, i) => (
                          <li key={i}>{ins}</li>
                        ))}
                        {(!selectedRec.structured_explanation?.insights || selectedRec.structured_explanation.insights.length === 0) && (
                          <li>Standard operating procedure</li>
                        )}
                      </ul>
                    </div>

                    <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", borderLeft: "4px solid #10b981", boxShadow: "var(--shadow-sm)" }}>
                      <h4 style={{ color: "var(--text-muted)", marginBottom: "12px", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>Predicted Impact</h4>
                      <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-main)", display: "flex", flexDirection: "column", gap: "8px", fontWeight: "500" }}>
                        {(selectedRec.structured_explanation?.impact || []).map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                        {(!selectedRec.structured_explanation?.impact || selectedRec.structured_explanation.impact.length === 0) && (
                          <li>Minimal deviation from baseline</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#fef2f2", padding: "24px", borderRadius: "16px", borderLeft: "4px solid #ef4444" }}>
                    <h4 style={{ color: "#ef4444", marginBottom: "8px", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.05em" }}>Counterfactual (What if we didn't intervene?)</h4>
                    <p style={{ color: "#7f1d1d", margin: 0, fontWeight: "600" }}>
                      {selectedRec.counterfactual || "If baseline was followed -> Expected normal operations."}
                    </p>
                  </div>
                </div>
              </Panel>

              <Panel title="Scoring Breakdown">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  {Object.entries(selectedRec.score_breakdown || {}).map(([key, value]) => (
                    <div key={key} style={{ backgroundColor: "white", padding: "20px", borderRadius: "16px", boxShadow: "var(--shadow-sm)", minWidth: 0 }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={key.replace(/_/g, ' ')}>
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div style={{ color: "var(--text-main)", fontSize: "1.2rem", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={String(value)}>{typeof value === 'number' && !Number.isNaN(value) ? value.toFixed(3) : value ?? "—"}</div>
                    </div>
                  ))}
                  
                  <div style={{ backgroundColor: "var(--dark-panel)", color: "white", padding: "20px", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
                      <div style={{ color: "var(--accent-lime-strong)", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>TOTAL SCORE</div>
                      <div style={{ color: "white", fontSize: "1.5rem", fontWeight: 800 }}>{(selectedRec.recommended_cost ?? 0).toFixed(2)}</div>
                  </div>
                </div>
              </Panel>
            </div>
          ) : (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)", background: "white", borderRadius: "24px", boxShadow: "var(--shadow-sm)" }}>
              Select a decision to view explainability details.
            </div>
          )}
        </div>
      </div>

      {activeRecs.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <Panel title="Decision Outcome Tracker">
            <div>
              <p style={{ color: "var(--text-muted)", marginBottom: "20px", fontWeight: "500" }}>
                The last {Math.min(5, activeRecs.length)} AI decisions and their predicted vs actual outcomes.
              </p>
              <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                      <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Time</th>
                      <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Action</th>
                      <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Baseline Cost</th>
                      <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>AI Cost</th>
                      <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Savings</th>
                      <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRecs.slice(0, 5).map((rec) => {
                      const savings = (rec.baseline_cost || 0) - (rec.recommended_cost || 0);
                      const accepted = rec.status === "accepted";
                      return (
                        <tr key={rec.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{formatTimeOnly(rec.simulation_time)}</td>
                          <td style={{ padding: "16px 0", fontWeight: 800, color: "var(--text-main)" }}>{(rec.action || "").replace(/_/g, " ").toUpperCase()}</td>
                          <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>₹{formatCompact(rec.baseline_cost || 0)}</td>
                          <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>₹{formatCompact(rec.recommended_cost || 0)}</td>
                          <td style={{ padding: "16px 0", color: savings > 0 ? "#10b981" : "var(--text-muted)", fontWeight: 800 }}>
                            {savings > 0 ? `+₹${formatCompact(savings)}` : "—"}
                          </td>
                          <td style={{ padding: "16px 0" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "6px 12px",
                              borderRadius: "999px",
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontWeight: 800,
                              backgroundColor: accepted ? "#f0fdf4" : "var(--bg-color)",
                              color: accepted ? "#16a34a" : "var(--text-muted)",
                            }}>
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
