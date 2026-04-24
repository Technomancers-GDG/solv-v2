import { Panel, MetricCard, ProgressBar } from "../common/UiPrimitives";

export function DashboardView({ metrics, criticalFacilities, proactiveDispatches, riskForecast, auditChain, blockchainVerify, facilityLookup }) {
  return (
    <div className="view-dashboard">
      <div className="metrics-grid">
        <MetricCard label="Critical Deliveries Saved" value={metrics?.critical_deliveries_saved ?? 0} tone="teal" />
        <MetricCard label="Stockouts Prevented" value={metrics?.stockouts_prevented ?? 0} tone="amber" />
        <MetricCard label="Beneficiary Locations" value={metrics?.beneficiary_locations_served ?? 0} tone="steel" />
        <MetricCard label="Wastage Prevented" value={`${Number(metrics?.spoilage_or_wastage_prevented ?? 0).toFixed(0)} units`} tone="coral" />
        <MetricCard label="CO₂ Saved" value={`${(metrics?.co2_saved_kg ?? 0).toFixed(1)} kg`} tone="green" />
        <MetricCard label="On-Time Delivery" value={`${metrics?.on_time_delivery_pct ?? 0}%`} tone="blue" />
      </div>
      <div className="dashboard-grid">
        <Panel title="Critical Capacity Watch">
          {criticalFacilities.length === 0 ? <div className="empty">No facility above 70% utilization.</div> : (
            <div className="util-list" style={{ display: "grid", gap: "10px" }}>
              {criticalFacilities.map((f) => (
                <div className="util-item" key={f.facility_id}>
                  <div className="util-meta" style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong>{f.facility_name}</strong>
                    <span>{f.utilization_pct.toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={Math.min(100, f.utilization_pct)} />
                  <div className="util-foot" style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85em", color: "var(--muted)", marginTop: "4px" }}><span>{f.city}</span><span>{Math.max(0, f.effective_available_units)} free</span></div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Proactive Dispatch AI">
          {proactiveDispatches.length === 0 ? <div className="empty">No proactive dispatches needed.</div> : (
            <div className="dispatch-list">
              {proactiveDispatches.slice(0, 5).map((d, i) => (
                <div className={`dispatch-card urgency-${d.urgency}`} key={i}>
                  <strong>{facilityLookup[d.destination_facility_id]?.name ?? "Facility"}</strong>
                  <span className="urgency-badge">{d.urgency}</span>
                  <p className="dispatch-reason">{d.reason}</p>
                  <div className="dispatch-meta">{d.recommended_units} units • ETA {d.eta_hours}h</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Risk Forecast (12h)" className="full-width">
          <div className="risk-grid">
            {riskForecast.slice(0, 8).map((rf, i) => (
              <div className={`risk-card severity-${rf.risk > 0.6 ? "high" : rf.risk > 0.3 ? "medium" : "low"}`} key={i}>
                <div className="risk-city">{rf.city}</div>
                <div className="risk-value">{(rf.risk * 100).toFixed(0)}%</div>
                <div className="risk-factors">{rf.factors?.join(", ")}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent Audit Blocks">
          <div className="audit-list">
            {auditChain.slice(-5).map((b, i) => (
              <div className="audit-item" key={i}>
                <span className="audit-index">#{b.index}</span>
                <span className="audit-type">{b.decision_type}</span>
                <span className="audit-action">{b.action}</span>
                <span className="audit-hash" title={b.hash}>{(b.hash ?? "").slice(0, 8)}...</span>
              </div>
            ))}
          </div>
          {blockchainVerify && (
            <div className={`verify-badge ${blockchainVerify.valid ? "valid" : "invalid"}`}>
              {blockchainVerify.valid ? "\u2713 Chain Verified" : "\u26A0 Tampering Detected"} • {blockchainVerify.block_count} blocks
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
