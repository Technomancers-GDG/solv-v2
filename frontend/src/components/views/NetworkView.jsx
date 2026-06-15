import { Panel } from "../common/UiPrimitives";

export function NetworkView({ facilities, vehicles }) {
  return (
    <div className="view-network" style={{ padding: "24px" }}>
      <div className="view-header" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Logistics Network</h2>
        <p style={{ color: "var(--text-muted)", fontSize: '1.1rem' }}>Global overview of your facilities and active fleet.</p>
      </div>

      <div className="bento-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <Panel title="Facilities">
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Name</th>
                  <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>City</th>
                  <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Type</th>
                  <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Capacity</th>
                  <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Inventory</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((f) => (
                  <tr key={f.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px 0", fontWeight: 800, color: "var(--text-main)" }}>{f.name}</td>
                    <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{f.city}</td>
                    <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{f.facility_type}</td>
                    <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{f.base_capacity_units.toLocaleString()}</td>
                    <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{f.current_inventory_units.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        
        <Panel title="Fleet">
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>ID</th>
                  <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Type</th>
                  <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Payload</th>
                  <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Speed</th>
                  <th style={{ padding: "0 0 16px 0", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "800", letterSpacing: "0.05em" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px 0", fontWeight: 800, color: "var(--text-main)" }}>{v.identifier}</td>
                    <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{v.vehicle_type}</td>
                    <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{v.payload_capacity_units}</td>
                    <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{v.average_speed_kmph}</td>
                    <td style={{ padding: "16px 0" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        borderRadius: "999px",
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: 800,
                        backgroundColor: "var(--bg-color)",
                        color: "var(--text-muted)"
                      }}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
