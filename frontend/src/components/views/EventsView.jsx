import { Panel } from "../common/UiPrimitives";

export function EventsView({ events = [] }) {
  return (
    <div className="view-events" style={{ padding: "24px" }}>
      <div className="view-header" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Global Events Feed</h2>
        <p style={{ color: "var(--text-muted)", fontSize: '1.1rem' }}>Live tracking of disruptions and weather events across the supply chain.</p>
      </div>

      <div className="bento-row" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
        {events.length === 0 && (
          <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)", background: "white", borderRadius: "20px", boxShadow: "var(--shadow-sm)", gridColumn: "1 / -1" }}>
            No active events in the network.
          </div>
        )}
        {events.slice(0, 20).map((e, i) => (
          <div key={i} style={{ background: "white", padding: "24px", borderRadius: "20px", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontWeight: "800", color: "var(--text-main)", fontSize: "1.1rem", flexShrink: 0 }}>{e.city}</span>
              <span style={{
                background: "var(--bg-color)",
                color: "var(--text-muted)",
                padding: "6px 12px",
                borderRadius: "999px",
                fontSize: "0.65rem",
                fontWeight: "800",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "65%",
                textAlign: "right"
              }} title={e.category}>
                {e.category}
              </span>
            </div>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.5", fontWeight: "500", flex: 1 }}>{e.headline}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase" }}>{e.impact_type}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>•</span>
              <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-main)" }}>Impact {Number(e.impact_score ?? 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
