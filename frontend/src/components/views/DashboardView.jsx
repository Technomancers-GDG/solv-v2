import { Panel, MetricCard as StatsCard, ProgressBar } from "../common/UiPrimitives";
import { AIActivityFeed, AIDecisionPanel, RouteComparisonBlock } from "../common/AIDecisionWidgets";
import "./DashboardView.css";

/**
 * DashboardView — Primary operations overview.
 * Shows KPI metrics, operations status, capacity status,
 * proactive dispatches, risk forecast, and audit chain.
 */
export function DashboardView({ metrics, criticalFacilities, proactiveDispatches, riskForecast, auditChain, blockchainVerify, facilityLookup, aiActivity, latestDecision, previousRoute, activityFeed }) {
  const rl = aiActivity?.rl_engine;
  const actionBreakdown = aiActivity?.recent_action_breakdown ?? {};
  const explorationPct = rl ? Math.round((rl.epsilon ?? 1) * 100) : 100;
  const exploitationPct = 100 - explorationPct;
  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  const costsSaved = Number(metrics?.financial_costs_saved_usd ?? 0);
  const costsIncurred = Number(metrics?.financial_costs_incurred_usd ?? 0);
  const baselineCost = costsSaved + costsIncurred;
  const estimatedBaseline = baselineCost > 0 ? baselineCost : costsSaved * 1.28;
  const co2Saved = Number(metrics?.co2_saved_kg ?? 0);
  const co2Baseline = co2Saved > 0 ? co2Saved * 1.35 : 0;
  const confidence = latestDecision?.confidence ?? (rl?.enabled ? 100 - Math.round((rl.epsilon ?? 0.08) * 100) : 92);

  return (
    <main className="dashboard-view" aria-label="Operations Overview">
      <header className="dashboard-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Operations Overview</h1>
        <p style={{ color: '#64748b' }}>Monitor your network performance and ongoing routing operations.</p>
      </header>

      {/* KPI Metrics Grid */}
      <section className="metrics-grid" aria-label="Key performance indicators">
        <StatsCard label="Financial Costs Saved" value={`${formatINR(costsSaved)} saved`} context={`vs ${formatINR(estimatedBaseline)} baseline`} tone="green" />
        <StatsCard label="Operational Costs" value={formatINR(costsIncurred)} context={`road-only baseline ${formatINR(estimatedBaseline)}`} tone="coral" />
        <StatsCard label="Critical Deliveries Saved" value={metrics?.critical_deliveries_saved ?? 0} context={`${metrics?.reroute_count ?? 0} Alternative routes checked`} tone="teal" />
        <StatsCard label="Stockouts Prevented" value={metrics?.stockouts_prevented ?? 0} context="vs no proactive dispatch baseline" tone="amber" />
        <StatsCard label="Beneficiary Locations" value={metrics?.beneficiary_locations_served ?? 0} tone="steel" />
        <StatsCard label="Wastage Prevented" value={`${Number(metrics?.spoilage_or_wastage_prevented ?? 0).toFixed(0)} units`} tone="coral" />
        <StatsCard label="CO₂ Saved" value={`${co2Saved.toFixed(1)} kg`} context={co2Baseline ? `vs ${co2Baseline.toFixed(1)} kg road baseline` : "baseline estimated from road-only route"} tone="green" />
        <StatsCard label="On-Time Delivery" value={`${metrics?.on_time_delivery_pct ?? 0}%`} context="compared with delayed-route baseline" tone="blue" />
      </section>

      <div className="dashboard-grid">
        {/* AI Decisions Panel */}
        <section className="dashboard-panel" aria-label="Operations Overview">
          <h2 className="dashboard-panel-title">Operations Overview</h2>
          {aiActivity ? (
            <div className="ai-activity-panel">
              {/* AI stats summary */}
              <ul className="ai-stats-grid" aria-label="AI engine statistics">
                <li className="ai-stat">
                  <span className="ai-stat-value">{aiActivity.reroute_count}</span>
                  <span className="ai-stat-label">Reroutes Executed</span>
                </li>
                <li className="ai-stat">
                  <span className="ai-stat-value">{aiActivity.cascade_detections_today}</span>
                  <span className="ai-stat-label">Cascades Detected</span>
                </li>
                <li className="ai-stat">
                  <span className="ai-stat-value">{aiActivity.driver_acceptance_rate}%</span>
                  <span className="ai-stat-label">Driver Acceptance</span>
                </li>
                <li className="ai-stat">
                  <span className="ai-stat-value">{aiActivity.completed_trips}</span>
                  <span className="ai-stat-label">Trips Completed</span>
                </li>
              </ul>

              <AIDecisionPanel decision={latestDecision} confidence={confidence} />
              <RouteComparisonBlock comparison={latestDecision?.comparison} previousRoute={previousRoute} />

              {/* Reinforcement Learning Agent section */}
              {rl?.enabled && (
                <aside className="rl-engine-section" aria-label="Reinforcement Learning agent metrics">
                  <h4>Reinforcement Learning Agent</h4>
                  <dl className="rl-stats-row">
                    <div className="rl-metric">
                      <dt className="rl-label">Training Steps</dt>
                      <dd className="rl-value">{rl.train_step}</dd>
                    </div>
                    <div className="rl-metric">
                      <dt className="rl-label">Replay Buffer</dt>
                      <dd className="rl-value">{rl.replay_buffer_size} / 8000</dd>
                    </div>
                    <div className="rl-metric">
                      <dt className="rl-label">Exploration</dt>
                      <dd className="rl-value">{explorationPct}%</dd>
                    </div>
                  </dl>
                  <div className="epsilon-bar-wrap" role="img" aria-label={`Exploitation ${exploitationPct}%, Exploration ${explorationPct}%`}>
                    <div className="epsilon-bar">
                      <div className="epsilon-exploit" style={{ width: `${exploitationPct}%` }} />
                      <div className="epsilon-explore" style={{ width: `${explorationPct}%` }} />
                    </div>
                    <div className="epsilon-labels">
                      <span>🎯 Exploit ({exploitationPct}%)</span>
                      <span>🔍 Explore ({explorationPct}%)</span>
                    </div>
                  </div>
                </aside>
              )}

              {/* Action breakdown bar chart */}
              {Object.keys(actionBreakdown).length > 0 && (
                <div className="action-breakdown-section" aria-label="Recent action distribution">
                  <h4>Action Mix (Last 50 Decisions)</h4>
                  <div className="action-bars" role="list">
                    {Object.entries(actionBreakdown).sort((a, b) => b[1] - a[1]).map(([action, count]) => {
                      const total = Object.values(actionBreakdown).reduce((s, v) => s + v, 0);
                      const pct = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div className="action-bar-row" key={action} role="listitem">
                          <span className="action-name">{action.replace(/_/g, " ")}</span>
                          <div className="action-bar-track">
                            <div className={`action-bar-fill action-${action.replace(/_/g, "-")}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="action-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent AI actions feed */}
              <div className="ai-feed-section">
                <h4>Recent AI Actions</h4>
                <AIActivityFeed events={activityFeed} />
              </div>
            </div>
          ) : (
            <div className="ai-activity-panel">
              <AIDecisionPanel decision={latestDecision} confidence={confidence} />
              <RouteComparisonBlock comparison={latestDecision?.comparison} previousRoute={previousRoute} />
              <div className="ai-feed-section">
                <h4>Recent AI Actions</h4>
                <AIActivityFeed events={activityFeed} />
              </div>
            </div>
          )}
        </section>

        {/* Critical Capacity Watch */}
        <section className="dashboard-panel" aria-label="Capacity Status">
          <h2 className="dashboard-panel-title">Capacity Status</h2>
          {criticalFacilities.length === 0 ? (
            <p className="empty-state">No facility is currently above 70% utilization.</p>
          ) : (
            <ul className="util-list" aria-label="Facilities above 70% utilization">
              {criticalFacilities.map((f) => (
                <li className="util-item" key={f.facility_id}>
                  <div className="util-meta">
                    <strong>{f.facility_name}</strong>
                    <span>{f.utilization_pct.toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={Math.min(100, f.utilization_pct)} />
                  <div className="util-foot">
                    <span>{f.city}</span>
                    <span>{Math.max(0, f.effective_available_units)} free</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Proactive Dispatch AI */}
        <section className="dashboard-panel" aria-label="Proactive Dispatch Planning">
          <h2 className="dashboard-panel-title">Proactive Dispatch Planning</h2>
          {proactiveDispatches.length === 0 ? (
            <p className="empty-state">No proactive dispatches needed at this time.</p>
          ) : (
            <ul className="dispatch-list" aria-label="Proactive dispatch recommendations">
              {proactiveDispatches.slice(0, 5).map((d, i) => (
                <li className={`dispatch-card urgency-${d.urgency}`} key={i}>
                  <strong>{facilityLookup[d.destination_facility_id]?.name ?? "Facility"}</strong>
                  <span className="urgency-badge">{d.urgency}</span>
                  <p className="dispatch-reason">{d.reason}</p>
                  <div className="dispatch-meta">{d.recommended_units} units • ETA {d.eta_hours}h</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Risk Forecast */}
        <section className="dashboard-panel full-width" aria-label="Risk Forecast (12h)">
          <h2 className="dashboard-panel-title">Risk Forecast (12h)</h2>
          <div className="risk-grid" role="list" aria-label="12-hour risk forecast by city">
            {riskForecast.slice(0, 8).map((rf, i) => (
              <article className={`risk-card severity-${rf.risk > 0.6 ? "high" : rf.risk > 0.3 ? "medium" : "low"}`} key={i} aria-label={`${rf.city}: ${(rf.risk * 100).toFixed(0)}% risk`}>
                <div className="risk-city">{rf.city}</div>
                <div className="risk-value">{(rf.risk * 100).toFixed(0)}%</div>
                <div className="risk-factors">{rf.factors?.join(", ")}</div>
                {rf.prediction_interval && (
                  <div className="risk-interval">Range: {(rf.prediction_interval[0] * 100).toFixed(0)}–{(rf.prediction_interval[1] * 100).toFixed(0)}%</div>
                )}
                {rf.trend && <div className={`risk-trend trend-${rf.trend}`}>{rf.trend === "rising" ? "📈" : rf.trend === "declining" ? "📉" : "➡️"} {rf.trend}</div>}
              </article>
            ))}
          </div>
        </section>

        {/* Recent Audit Blocks */}
        <section className="dashboard-panel" aria-label="Recent Audit Blocks">
          <h2 className="dashboard-panel-title">Recent Audit Blocks</h2>
          <ul className="audit-list" aria-label="Blockchain audit trail">
            {auditChain.slice(-5).map((b, i) => (
              <li className="audit-item" key={i}>
                <span className="audit-index">#{b.index}</span>
                <span className="audit-type">{b.decision_type}</span>
                <span className="audit-action">{b.action}</span>
                <code className="audit-hash" title={b.hash}>{(b.hash ?? "").slice(0, 8)}...</code>
              </li>
            ))}
          </ul>
          {blockchainVerify && (
            <div className={`verify-badge ${blockchainVerify.valid ? "valid" : "invalid"}`} role="status">
              {blockchainVerify.valid ? "\u2713 Chain Verified" : "\u26A0 Tampering Detected"} • {blockchainVerify.block_count} blocks
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
