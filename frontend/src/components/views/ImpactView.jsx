import { Panel } from "../common/UiPrimitives";

export function ImpactView({ metrics }) {
  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="view-impact" style={{ padding: "24px" }}>
      <div className="view-header" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Impact & SDG Tracking</h2>
        <p style={{ color: "var(--text-muted)", fontSize: '1.1rem' }}>Measuring operational success against Sustainable Development Goals.</p>
      </div>

      <div className="bento-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "24px" }}>
        {[
          { label: "Financial Costs Saved (AI)", value: formatINR(metrics?.financial_costs_saved_usd), tone: "var(--accent-lime-strong)", bg: "var(--dark-panel)", text: "white" },
          { label: "Operational Costs Incurred", value: formatINR(metrics?.financial_costs_incurred_usd) },
          { label: "CO₂ Saved", value: `${(metrics?.co2_saved_kg ?? 0).toFixed(1)} kg` },
          { label: "Idle Minutes Prevented", value: `${(metrics?.idle_minutes_prevented ?? 0).toFixed(0)}` },
          { label: "On-Time Delivery", value: `${metrics?.on_time_delivery_pct ?? 0}%` },
          { label: "Warehouse Utilization", value: `${metrics?.warehouse_utilization_pct ?? 0}%` },
          { label: "Critical Deliveries Saved", value: metrics?.critical_deliveries_saved ?? 0 },
          { label: "Stockouts Prevented", value: metrics?.stockouts_prevented ?? 0 }
        ].map((m, i) => (
          <div key={i} style={{ background: m.bg || "white", padding: "24px", borderRadius: "20px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "800", color: m.text ? "rgba(255,255,255,0.7)" : "var(--text-muted)", textTransform: "uppercase" }}>{m.label}</span>
            <span style={{ fontSize: "1.8rem", fontWeight: "800", color: m.text || "var(--text-main)" }}>{m.value}</span>
            {m.tone && <div style={{ height: "4px", width: "40px", background: m.tone, borderRadius: "2px", marginTop: "auto" }} />}
          </div>
        ))}
      </div>

      <Panel title="SDG Alignment">
        <div className="bento-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
          {[
            { sdg: "9", title: "Industry & Innovation", desc: "AI-driven logistics optimization and predictive analytics" },
            { sdg: "11", title: "Sustainable Cities", desc: "Reduced congestion and emissions through intelligent routing" },
            { sdg: "12", title: "Responsible Consumption", desc: "Wastage prevention through demand forecasting" },
            { sdg: "13", title: "Climate Action", desc: "CO₂ reduction via optimized fleet operations" }
          ].map((item, i) => (
            <div key={i} style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ background: "var(--dark-panel)", color: "white", padding: "6px 12px", borderRadius: "8px", fontWeight: "800", fontSize: "0.85rem" }}>SDG {item.sdg}</span>
                <strong style={{ color: "var(--text-main)", fontSize: "1.1rem" }}>{item.title}</strong>
              </div>
              <p style={{ margin: "8px 0 0 0", color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.5", fontWeight: "500" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
