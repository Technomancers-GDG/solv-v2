import { AIActivityFeed, AIDecisionPanel, RouteComparisonBlock } from "../common/AIDecisionWidgets";
import "./DashboardView.css";

export function DashboardView({ metrics, criticalFacilities, proactiveDispatches, riskForecast, auditChain, blockchainVerify, facilityLookup, aiActivity, latestDecision, previousRoute, activityFeed }) {
  const rl = aiActivity?.rl_engine;
  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  const costsSaved = Number(metrics?.financial_costs_saved_usd ?? 0);
  const costsIncurred = Number(metrics?.financial_costs_incurred_usd ?? 0);
  const baselineCost = costsSaved + costsIncurred;
  const estimatedBaseline = baselineCost > 0 ? baselineCost : costsSaved * 1.28;
  const co2Saved = Number(metrics?.co2_saved_kg ?? 0);
  const confidence = latestDecision?.confidence ?? (rl?.enabled ? 100 - Math.round((rl.epsilon ?? 0.08) * 100) : 92);

  return (
    <main className="dashboard-view" aria-label="Command Center Dashboard">
      <header className="dashboard-header">
        <h1>Global Network Telemetry</h1>
        <p>Real-time autonomous routing, capacity tracking, and predictive dispatch intelligence.</p>
      </header>

      <div className="cmd-bento-grid">
        
        {/* Top Highlight 1: Financial Impact */}
        <section className="cmd-panel panel-hero-1">
          <h2 className="cmd-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Financial Optimization
          </h2>
          <div className="metric-glance">
            <div className="metric-glance-value glow-green">{formatINR(costsSaved)}</div>
            <div className="metric-glance-context">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              Saved against {formatINR(estimatedBaseline)} static routing baseline
            </div>
          </div>
        </section>

        {/* Top Highlight 2: Environmental Impact */}
        <section className="cmd-panel panel-hero-2">
          <h2 className="cmd-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Carbon Emissions Reduced
          </h2>
          <div className="metric-glance">
            <div className="metric-glance-value glow-blue">{co2Saved.toFixed(1)} kg</div>
            <div className="metric-glance-context">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
              CO₂ offset via AI-optimized logistics routes
            </div>
          </div>
        </section>

        {/* Top Highlight 3: Operational Impact */}
        <section className="cmd-panel panel-hero-3">
          <h2 className="cmd-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 22 22 22"/></svg>
            Critical Stockouts Prevented
          </h2>
          <div className="metric-glance">
            <div className="metric-glance-value glow-amber">{metrics?.stockouts_prevented ?? 0} Events</div>
            <div className="metric-glance-context">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {metrics?.critical_deliveries_saved ?? 0} critical deliveries salvaged
            </div>
          </div>
        </section>

        {/* AI Operations Core */}
        <section className="cmd-panel panel-ai-core">
          <h2 className="cmd-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Autonomous Routing Engine
          </h2>
          
          <div className="ai-core-layout">
            <div className="ai-telemetry">
              <div className="telemetry-item">
                <span className="telemetry-label">Engine Status</span>
                <span className="telemetry-value" style={{ color: '#4ade80' }}>Active (v2.4)</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">Live Reroutes</span>
                <span className="telemetry-value">{aiActivity?.reroute_count ?? 0}</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">Cascade Detections</span>
                <span className="telemetry-value">{aiActivity?.cascade_detections_today ?? 0}</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">Driver Acceptance</span>
                <span className="telemetry-value">{aiActivity?.driver_acceptance_rate ?? 0}%</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">Global Confidence</span>
                <span className="telemetry-value">{confidence}%</span>
              </div>
            </div>

            <div className="ai-visualizer">
               {aiActivity ? (
                 <>
                  <AIDecisionPanel decision={latestDecision} confidence={confidence} />
                  <RouteComparisonBlock comparison={latestDecision?.comparison} previousRoute={previousRoute} />
                 </>
               ) : (
                 <div className="empty-cmd">Awaiting routing telemetry streams...</div>
               )}
            </div>
          </div>
        </section>

        {/* Capacity Saturation Watch */}
        <section className="cmd-panel panel-capacity">
          <h2 className="cmd-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Network Saturation
          </h2>
          {criticalFacilities.length === 0 ? (
            <div className="empty-cmd">Global facility capacities optimal.</div>
          ) : (
            <ul className="cmd-list">
              {criticalFacilities.map(f => (
                <li className="cmd-list-item" key={f.facility_id}>
                  <div className="item-main">
                    <span className="item-title">{f.facility_name}</span>
                    <span className="item-sub">{f.city} • {Math.max(0, f.effective_available_units)} units free</span>
                  </div>
                  <span className="item-value" style={{ color: f.utilization_pct > 85 ? '#f87171' : '#fbbf24' }}>
                    {f.utilization_pct.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Predictive Dispatches */}
        <section className="cmd-panel panel-dispatch">
          <h2 className="cmd-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Predictive AI Dispatches
          </h2>
          {proactiveDispatches.length === 0 ? (
            <div className="empty-cmd">No proactive unit rebalancing required.</div>
          ) : (
            <ul className="cmd-list">
              {proactiveDispatches.slice(0, 4).map((d, i) => (
                <li className="cmd-list-item" key={i}>
                  <div className="item-main">
                    <span className="item-title">{facilityLookup[d.destination_facility_id]?.name ?? "Facility"}</span>
                    <span className="item-sub">{d.reason}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="item-value" style={{ color: '#60a5fa' }}>+{d.recommended_units}</span>
                    <div className="item-sub">ETA {d.eta_hours}h</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Distributed Risk Topology */}
        <section className="cmd-panel panel-risk">
          <h2 className="cmd-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            12-Hour Geographical Risk Topology
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {riskForecast.slice(0, 4).map((rf, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 600 }}>{rf.city}</div>
                <div style={{ fontSize: '2rem', fontWeight: 300, color: rf.risk > 0.6 ? '#f87171' : rf.risk > 0.3 ? '#fbbf24' : '#4ade80', margin: '4px 0' }}>
                  {(rf.risk * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--cmd-text-secondary)' }}>{rf.factors?.join(", ")}</div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}