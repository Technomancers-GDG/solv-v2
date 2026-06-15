import { useState, useMemo } from "react";
import { Panel } from "../common/UiPrimitives";

export function NetworkView({ facilities = [], vehicles = [] }) {
  const [facilitySearch, setFacilitySearch] = useState("");
  const [facilityType, setFacilityType] = useState("all");
  const [vehicleType, setVehicleType] = useState("all");
  const [vehicleStatus, setVehicleStatus] = useState("all");

  const facilityTypes = useMemo(() => {
    const types = new Set();
    facilities.forEach(f => f.facility_type && types.add(f.facility_type));
    return ["all", ...Array.from(types)];
  }, [facilities]);

  const vehicleTypes = useMemo(() => {
    const types = new Set();
    vehicles.forEach(v => v.vehicle_type && types.add(v.vehicle_type));
    return ["all", ...Array.from(types)];
  }, [vehicles]);

  const vehicleStatuses = useMemo(() => {
    const statuses = new Set();
    vehicles.forEach(v => v.status && statuses.add(v.status));
    return ["all", ...Array.from(statuses)];
  }, [vehicles]);

  const filteredFacilities = useMemo(() => {
    return (facilities ?? []).filter(f => {
      if (facilitySearch && !(f.name ?? "").toLowerCase().includes(facilitySearch.toLowerCase()) &&
          !(f.city ?? "").toLowerCase().includes(facilitySearch.toLowerCase())) return false;
      if (facilityType !== "all" && f.facility_type !== facilityType) return false;
      return true;
    });
  }, [facilities, facilitySearch, facilityType]);

  const filteredVehicles = useMemo(() => {
    return (vehicles ?? []).filter(v => {
      if (vehicleType !== "all" && v.vehicle_type !== vehicleType) return false;
      if (vehicleStatus !== "all" && v.status !== vehicleStatus) return false;
      return true;
    });
  }, [vehicles, vehicleType, vehicleStatus]);

  const noData = (!facilities || facilities.length === 0) && (!vehicles || vehicles.length === 0);

  return (
    <div className="view-network" style={{ padding: "24px" }}>
      <div className="view-header" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>Logistics Network</h2>
        <p style={{ color: "var(--text-muted)", fontSize: '1.1rem' }}>Global overview of your facilities and active fleet.</p>
      </div>

      <div className="bento-row" style={{ gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <Panel title="Facilities">
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "160px", maxWidth: "280px" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", color: "var(--text-muted)", pointerEvents: "none" }}>🔍</span>
              <input
                type="text"
                placeholder="Search facilities..."
                value={facilitySearch}
                onChange={e => setFacilitySearch(e.target.value)}
                style={{ width: "100%", padding: "9px 14px 9px 36px", borderRadius: "999px", border: "none", background: "var(--bg-color)", color: "var(--text-main)", fontSize: "0.85rem", outline: "none", boxShadow: "var(--shadow-sm)" }}
              />
            </div>
            <select
              value={facilityType}
              onChange={e => setFacilityType(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: "999px", border: "none", background: "var(--bg-color)", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", outline: "none", boxShadow: "var(--shadow-sm)", minWidth: "110px" }}
            >
              {facilityTypes.map(t => (
                <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>
              ))}
            </select>
          </div>
          <div style={{ background: "var(--surface-card)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)", border: "var(--card-border, 1px solid var(--border))", overflowX: "auto" }}>
            {filteredFacilities.length > 0 ? (
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
                  {filteredFacilities.map((f) => (
                    <tr key={f.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "16px 0", fontWeight: 800, color: "var(--text-main)" }}>{f.name}</td>
                      <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{f.city}</td>
                      <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{f.facility_type}</td>
                      <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{(f.base_capacity_units ?? 0).toLocaleString()}</td>
                      <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{(f.current_inventory_units ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty" style={{ color: "var(--text-muted)", padding: "24px 0", textAlign: "center", fontWeight: 600 }}>
                {facilitySearch || facilityType !== "all" ? "No facilities match your filters." : "No facilities loaded."}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Fleet">
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <select
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: "999px", border: "none", background: "var(--bg-color)", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", outline: "none", boxShadow: "var(--shadow-sm)", minWidth: "120px" }}
            >
              {vehicleTypes.map(t => (
                <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>
              ))}
            </select>
            <select
              value={vehicleStatus}
              onChange={e => setVehicleStatus(e.target.value)}
              style={{ padding: "9px 14px", borderRadius: "999px", border: "none", background: "var(--bg-color)", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", outline: "none", boxShadow: "var(--shadow-sm)", minWidth: "120px" }}
            >
              {vehicleStatuses.map(s => (
                <option key={s} value={s}>{s === "all" ? "All Status" : s}</option>
              ))}
            </select>
          </div>
          <div style={{ background: "var(--surface-card)", borderRadius: "16px", padding: "24px", boxShadow: "var(--shadow-sm)", border: "var(--card-border, 1px solid var(--border))", overflowX: "auto" }}>
            {filteredVehicles.length > 0 ? (
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
                  {filteredVehicles.map((v) => (
                    <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "16px 0", fontWeight: 800, color: "var(--text-main)" }}>{v.identifier}</td>
                      <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{v.vehicle_type}</td>
                      <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{v.payload_capacity_units ?? "—"}</td>
                      <td style={{ padding: "16px 0", color: "var(--text-muted)", fontWeight: "600" }}>{v.average_speed_kmph ?? "—"}</td>
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
            ) : (
              <div className="empty" style={{ color: "var(--text-muted)", padding: "24px 0", textAlign: "center", fontWeight: 600 }}>
                {vehicleType !== "all" || vehicleStatus !== "all" ? "No vehicles match your filters." : "No vehicles loaded."}
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
