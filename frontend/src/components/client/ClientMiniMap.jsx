export default function ClientMiniMap({ facilities, vehicles }) {
  return (
    <div style={{ background: "#111827", borderRadius: 8, padding: 12, border: "1px solid #1f2937", height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#6b7280", fontSize: 12, textAlign: "center" }}>
        <span style={{ fontSize: 24, display: "block", marginBottom: 4 }}>&#127758;</span>
        {facilities?.length ? `${facilities.length} facilities` : "No data"}
        {vehicles?.length ? ` \u2022 ${vehicles.length} vehicles` : ""}
        <br />
        <span style={{ fontSize: 10 }}>Map requires Leaflet integration (optional)</span>
      </div>
    </div>
  );
}
