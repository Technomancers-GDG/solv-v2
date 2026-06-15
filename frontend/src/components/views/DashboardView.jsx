import { Panel, MetricCard, ProgressBar } from "../common/UiPrimitives";
import { AIActivityFeed, AIDecisionPanel, RouteComparisonBlock } from "../common/AIDecisionWidgets";

export function DashboardView({ metrics, criticalFacilities = [], proactiveDispatches = [], riskForecast = [], auditChain = [], blockchainVerify, facilityLookup, aiActivity, latestDecision, previousRoute, activityFeed }) {
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
    <div className="view-dashboard">
      <div className="dashboard-header">
        <h1>Global Network Telemetry</h1>
        <p>Real-time autonomous routing, capacity tracking, and predictive dispatch intelligence.</p>
      </div>

      <div className="bento-row">
        <div className="bento-card fin-card">
          <div className="eyebrow">$ FINANCIAL OPTIMIZATION</div>
          <h2>{formatINR(costsSaved)}</h2>
          <div className="subtext">
            <span>📈</span> Saved against {formatINR(estimatedBaseline)} static routing baseline
          </div>
        </div>
        <div className="bento-card carbon-card">
          <div className="eyebrow">$ CARBON EMISSIONS REDUCED</div>
          <h2>{co2Saved.toFixed(1)} kg</h2>
          <div className="subtext">
            <span>💧</span> CO₂ offset via AI-optimized logistics routes
          </div>
        </div>
        <div className="bento-card stockout-card">
          <div className="eyebrow">⚠️ CRITICAL STOCKOUTS PREVENTED</div>
          <h2>{metrics?.stockouts_prevented ?? 0} Events</h2>
          <div className="subtext">
            <span>🕒</span> {metrics?.critical_deliveries_saved ?? 0} critical deliveries salvaged
          </div>
        </div>
      </div>

      <div className="bento-row-bottom">
        <div className="bento-card engine-card">
          <div className="engine-stats">
            <div className="engine-stats-header">$ AUTONOMOUS ROUTING ENGINE</div>
            <div className="stat-row">
              <span>Engine Status</span>
              <strong>Active (v2.4)</strong>
            </div>
            <div className="stat-row">
              <span>Live Reroutes</span>
              <strong>{aiActivity?.reroute_count ?? 0}</strong>
            </div>
            <div className="stat-row">
              <span>Cascade Detections</span>
              <strong>{aiActivity?.cascade_detections_today ?? 0}</strong>
            </div>
            <div className="stat-row">
              <span>Driver Acceptance</span>
              <strong>{aiActivity?.driver_acceptance_rate ?? 0}%</strong>
            </div>
            <div className="stat-row">
              <span>Global Confidence</span>
              <strong>{confidence}%</strong>
            </div>
          </div>
          <div className="engine-recommendation">
            <div className="rec-header">
              <span>LATEST RECOMMENDATION</span>
              <span className="confidence-pill">Confidence Score: {confidence}%</span>
            </div>
            <h3 className="rec-title">→ {latestDecision?.title ?? "Awaiting Intelligence..."}</h3>
            <div className="rec-details">
              <div className="rec-detail-row">
                <h4>Reason</h4>
                <p>{latestDecision?.reason ?? "System monitoring network conditions."}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bento-card saturation-card">
          <div className="eyebrow" style={{fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "16px"}}>🖥️ NETWORK SATURATION</div>
          <div className="saturation-list">
            {criticalFacilities.length === 0 ? (
              <div className="empty">No critical saturation detected.</div>
            ) : (
              criticalFacilities.slice(0, 3).map((f, i) => (
                <div className="sat-item" key={i}>
                  <div className="sat-item-info">
                    <h4>{f.facility_name}</h4>
                    <p>{f.city} • {f.effective_available_units} units free</p>
                  </div>
                  <div className="sat-value">{f.utilization_pct.toFixed(1)}%</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bento-row">
        {/* AI Decisions Panel */}
        <div className="bento-card" style={{ flex: '2' }}>
          <div className="eyebrow" style={{marginBottom: "16px"}}>🧠 AI DECISION ENGINE — LIVE</div>
          {aiActivity ? (
            <div className="ai-activity-panel">
              <div className="ai-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="ai-stat" style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '16px' }}>
                  <div className="ai-stat-value" style={{ fontSize: '1.5rem', fontWeight: '800' }}>{aiActivity.reroute_count}</div>
                  <div className="ai-stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reroutes Executed</div>
                </div>
                <div className="ai-stat" style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '16px' }}>
                  <div className="ai-stat-value" style={{ fontSize: '1.5rem', fontWeight: '800' }}>{aiActivity.cascade_detections_today}</div>
                  <div className="ai-stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cascades Detected</div>
                </div>
                <div className="ai-stat" style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '16px' }}>
                  <div className="ai-stat-value" style={{ fontSize: '1.5rem', fontWeight: '800' }}>{aiActivity.driver_acceptance_rate}%</div>
                  <div className="ai-stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Driver Acceptance</div>
                </div>
                <div className="ai-stat" style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '16px' }}>
                  <div className="ai-stat-value" style={{ fontSize: '1.5rem', fontWeight: '800' }}>{aiActivity.completed_trips}</div>
                  <div className="ai-stat-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trips Completed</div>
                </div>
              </div>
              <AIDecisionPanel decision={latestDecision} confidence={confidence} />
              <RouteComparisonBlock comparison={latestDecision?.comparison} previousRoute={previousRoute} />
            </div>
          ) : (
            <div className="ai-activity-panel">
              <AIDecisionPanel decision={latestDecision} confidence={confidence} />
              <RouteComparisonBlock comparison={latestDecision?.comparison} previousRoute={previousRoute} />
            </div>
          )}
        </div>

        {/* Proactive Dispatch AI */}
        <div className="bento-card" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          <div className="eyebrow" style={{marginBottom: "16px"}}>📦 PROACTIVE DISPATCH AI</div>
          {proactiveDispatches.length === 0 ? <div className="empty" style={{color: 'var(--text-muted)', margin: 'auto'}}>No proactive dispatches needed.</div> : (
            <div className="dispatch-list" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {proactiveDispatches.slice(0, 5).map((d, i) => (
                <div className="dispatch-card" key={i} style={{background: 'var(--bg-color)', padding: '16px', borderRadius: '16px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <strong>{facilityLookup[d.destination_facility_id]?.name ?? "Facility"}</strong>
                    <span style={{background: 'var(--accent-lime-strong)', color: 'black', padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '800'}}>{d.urgency}</span>
                  </div>
                  <p style={{fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px'}}>{d.reason}</p>
                  <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{d.recommended_units} units • ETA {d.eta_hours}h</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bento-row">
        {/* Risk Forecast */}
        <div className="bento-card" style={{ flex: '2' }}>
          <div className="eyebrow" style={{marginBottom: "16px"}}>🔮 RISK FORECAST (12H)</div>
          <div className="risk-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px'}}>
            {riskForecast.slice(0, 8).map((rf, i) => (
              <div key={i} className="risk-card" style={{background: 'var(--bg-color)', padding: '16px', borderRadius: '16px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                  <div style={{fontWeight: '800', color: 'var(--text-main)'}}>{rf.city}</div>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: rf.risk > 0.6 ? '#ef4444' : rf.risk > 0.3 ? '#f59e0b' : '#10b981',
                    boxShadow: rf.risk > 0.6 ? '0 0 8px rgba(239,68,68,0.5)' : 'none'
                  }} />
                </div>
                <div style={{fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.03em'}}>{(rf.risk * 100).toFixed(0)}%</div>
                <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4'}}>{rf.factors?.join(", ")}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Blocks */}
        <div className="bento-card" style={{ flex: '1', background: 'var(--dark-panel)', color: 'white' }}>
          <div className="eyebrow" style={{marginBottom: "16px", color: '#9ca3af'}}>⛓️ RECENT AUDIT BLOCKS</div>
          {auditChain.length === 0 ? (
             <div className="empty" style={{color: '#6b7280', margin: 'auto', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600'}}>No recent network transactions recorded.</div>
          ) : (
            <div className="audit-list" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {auditChain.slice(-5).map((b, i) => (
                <div key={i} style={{background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <span style={{color: '#9ca3af', marginRight: '8px'}}>#{b.index}</span>
                    <span style={{fontWeight: '600'}}>{b.decision_type}</span>
                  </div>
                  <span style={{fontFamily: 'monospace', color: 'var(--accent-lime-strong)'}}>{(b.hash ?? "").slice(0, 8)}...</span>
                </div>
              ))}
            </div>
          )}
          {blockchainVerify && (
            <div style={{marginTop: '16px', padding: '12px', borderRadius: '12px', background: blockchainVerify.valid ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)', color: blockchainVerify.valid ? '#4ade80' : '#f87171', textAlign: 'center', fontSize: '0.85rem', fontWeight: '800'}}>
              {blockchainVerify.valid ? "✓ CHAIN VERIFIED" : "⚠ TAMPERING DETECTED"} • {blockchainVerify.block_count} BLOCKS
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
