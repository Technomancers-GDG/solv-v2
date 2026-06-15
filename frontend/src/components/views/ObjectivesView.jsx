export function ObjectivesView({ objectives, facilityLookup }) {
  return (
    <div className="view-objectives" style={{ padding: "24px" }}>
      <div className="view-header" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Logistics Objectives</h2>
        <p style={{ color: "var(--text-muted)", fontSize: '1.1rem' }}>Active delivery lanes, priorities, and assigned fleet quotas.</p>
      </div>

      <div className="bento-row" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
        {objectives.map((o) => (
          <div key={o.id} style={{ background: "white", padding: "24px", borderRadius: "20px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--text-main)" }}>{o.name}</h3>
              <span style={{
                background: o.priority <= 2 ? "#fef2f2" : "var(--bg-color)",
                color: o.priority <= 2 ? "#ef4444" : "var(--text-muted)",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: "800"
              }}>
                P{o.priority} Priority
              </span>
            </div>
            
            <p style={{ margin: 0, color: "var(--text-main)", fontWeight: "600", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "12px" }}>
              <span>{facilityLookup[o.origin_facility_id]?.city}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>→</span>
              <span>{facilityLookup[o.destination_facility_id]?.city}</span>
            </p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px" }}>
              <div style={{ background: "var(--bg-color)", padding: "12px", borderRadius: "12px" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "4px" }}>Commodity</div>
                <div style={{ fontWeight: "700", color: "var(--text-main)" }}>{o.commodity}</div>
              </div>
              <div style={{ background: "var(--bg-color)", padding: "12px", borderRadius: "12px" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "4px" }}>Cadence</div>
                <div style={{ fontWeight: "700", color: "var(--text-main)" }}>{o.dispatch_interval_minutes} min</div>
              </div>
              <div style={{ background: "var(--bg-color)", padding: "12px", borderRadius: "12px" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "4px" }}>Fleet</div>
                <div style={{ fontWeight: "700", color: "var(--text-main)" }}>{o.assigned_vehicle_ids?.length ?? 0} vehicles</div>
              </div>
              <div style={{ background: "var(--bg-color)", padding: "12px", borderRadius: "12px" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "4px" }}>Fallbacks</div>
                <div style={{ fontWeight: "700", color: "var(--text-main)" }}>{o.fallback_facility_ids?.length ?? 0} facilities</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
