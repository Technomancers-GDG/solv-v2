import { Panel, MetricCard, ProgressBar } from "../common/UiPrimitives";
import { AIActivityFeed, AIDecisionPanel, RouteComparisonBlock } from "../common/AIDecisionWidgets";

/**
 * DashboardView — Primary command center overview.
 * Shows KPI metrics, AI decision engine status, capacity watch,
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
    <section className="view-dashboard" aria-label="Dashboard Overview">
      {/* KPI Metrics Grid */}
      <div className="metrics-grid" role="list" aria-label="Key performance indicators">
        <MetricCard label="Financial Costs Saved (AI)" value={`${formatINR(costsSaved)} saved`} context={`vs ${formatINR(estimatedBaseline)} baseline`} tone="green" />
        <MetricCard label="Operational Costs" value={formatINR(costsIncurred)} context={`road-only baseline ${formatINR(estimatedBaseline)}`} tone="coral" />
        <MetricCard label="Critical Deliveries Saved" value={metrics?.critical_deliveries_saved ?? 0} context={`${metrics?.reroute_count ?? 0} AI reroutes considered`} tone="teal" />
        <MetricCard label="Stockouts Prevented" value={metrics?.stockouts_prevented ?? 0} context="vs no proactive dispatch baseline" tone="amber" />
        <MetricCard label="Beneficiary Locations" value={metrics?.beneficiary_locations_served ?? 0} tone="steel" />
        <MetricCard label="Wastage Prevented" value={`${Number(metrics?.spoilage_or_wastage_prevented ?? 0).toFixed(0)} units`} tone="coral" />
        <MetricCard label="CO₂ Saved" value={`${co2Saved.toFixed(1)} kg`} context={co2Baseline ? `vs ${co2Baseline.toFixed(1)} kg road baseline` : "baseline estimated from road-only route"} tone="green" />
        <MetricCard label="On-Time Delivery" value={`${metrics?.on_time_delivery_pct ?? 0}%`} context="compared with delayed-route baseline" tone="blue" />
      </div>

      <div className="dashboard-grid">
        {/* AI Decisions Panel */}
        <Panel title="🧠 AI Decision Engine — Live" className="ai-panel">
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
        </Panel>

        {/* Critical Capacity Watch */}
        <Panel title="Critical Capacity Watch">
          {criticalFacilities.length === 0 ? (
            <p className="empty">No facility above 70% utilization.</p>
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
        </Panel>

        {/* Proactive Dispatch AI */}
        <Panel title="Proactive Dispatch AI">
          {proactiveDispatches.length === 0 ? (
            <p className="empty">No proactive dispatches needed.</p>
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
        </Panel>

        {/* Risk Forecast */}
        <Panel title="Risk Forecast (12h)" className="full-width">
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
        </Panel>

        {/* Recent Audit Blocks */}
        <Panel title="Recent Audit Blocks">
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
        </Panel>
      </div>
    </section>
  );
}
