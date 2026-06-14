import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { setToken, clientApi, getToken } from "../lib/clientApi";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  const loadDashboard = useCallback(async () => {
    try {
      const d = await clientApi.get("/api/v1/client/dashboard");
      setData(d);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const wsBase = import.meta.env.VITE_WS_BASE_URL || `ws://${location.host}`;
    let retryDelay = 1000;
    let socket;

    function connect() {
      socket = new WebSocket(`${wsBase}/ws/client?token=${token}`);
      wsRef.current = socket;

      socket.onopen = () => { setWsConnected(true); retryDelay = 1000; };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "simulation_snapshot") {
            loadDashboard();
          }
        } catch {}
      };
      socket.onclose = () => {
        setWsConnected(false);
        setTimeout(() => { if (retryDelay < 16000) { retryDelay *= 2; } connect(); }, retryDelay + Math.random() * 1000);
      };
      socket.onerror = () => { socket?.close(); };
    }

    connect();
    return () => { socket?.close(); };
  }, []);

  const handleLogout = () => {
    setToken(null);
    navigate("/client/login");
  };

  if (loading) return <div style={{ minHeight: "100vh", background: "#101622", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b8d93" }}>Loading operations...</div>;

  const stats = data?.status || {};
  const metrics = data?.metrics || {};
  const fleet = data?.fleet || [];
  const decisions = data?.recent_decisions || [];

  return (
    <div style={{ minHeight: "100vh", background: "#101622", color: "#f4f7fb" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", background: "#1a2332", borderBottom: "1px solid #2a3342" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="logo-mark" style={{ background: "#2563eb", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontSize: 16, fontWeight: 700, color: "#fff" }}>L</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16 }}>Logisight — {data?.client?.name || "Operations Hub"}</h2>
            <span style={{ fontSize: 12, color: wsConnected ? "#10b981" : "#ef4444" }}>{wsConnected ? "Live" : "Disconnected"}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/client/upload")} style={{ padding: "6px 14px", background: "#374151", color: "#e5e7eb", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Upload Data</button>
          <button onClick={handleLogout} style={{ padding: "6px 14px", background: "#451a1a", color: "#fca5a5", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Logout</button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        {error && <div style={{ padding: "8px 12px", background: "#451a1a", color: "#fca5a5", borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{error}</div>}

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Facilities", count: stats.facilities, icon: "\ud83d\udce6" },
            { label: "Vehicles", count: stats.vehicles, icon: "\ud83d\ude9b" },
            { label: "Drivers", count: stats.drivers, icon: "\ud83d\udc64" },
            { label: "Routes", count: stats.objectives, icon: "\ud83d\udccb" },
            { label: "On-Time %", count: `${Math.round(metrics.on_time_delivery_pct || 0)}%`, icon: "\u2705" },
          ].map((card) => (
            <div key={card.label} style={{ background: "#1a2332", borderRadius: 10, padding: 16, border: "1px solid #2a3342" }}>
              <div style={{ fontSize: 12, color: "#8b8d93" }}>{card.icon} {card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#f4f7fb", marginTop: 4 }}>{card.count}</div>
            </div>
          ))}
        </div>

        {/* Fleet Table */}
        <div style={{ background: "#1a2332", borderRadius: 10, padding: 20, border: "1px solid #2a3342", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>\ud83d\ude9b Fleet Status</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#8b8d93", textAlign: "left" }}>
                <th style={{ padding: "6px 8px", borderBottom: "1px solid #2a3342" }}>ID</th>
                <th style={{ padding: "6px 8px", borderBottom: "1px solid #2a3342" }}>Status</th>
                <th style={{ padding: "6px 8px", borderBottom: "1px solid #2a3342" }}>Home Facility</th>
                <th style={{ padding: "6px 8px", borderBottom: "1px solid #2a3342" }}>Current</th>
                <th style={{ padding: "6px 8px", borderBottom: "1px solid #2a3342" }}>Capacity</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map(v => (
                <tr key={v.id} style={{ borderBottom: "1px solid #1f2937" }}>
                  <td style={{ padding: "8px", fontWeight: 600 }}>{v.identifier}</td>
                  <td style={{ padding: "8px" }}>
                    <span style={{
                      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                      background: v.status === "in_transit" ? "#10b981" : v.status === "loading" ? "#f59e0b" : "#6b7280",
                      marginRight: 6,
                    }} />
                    {v.status}
                  </td>
                  <td style={{ padding: "8px", color: "#94a3b8" }}>{v.home_facility}</td>
                  <td style={{ padding: "8px", color: "#94a3b8" }}>{v.current_facility || v.eta || "\u2014"}</td>
                  <td style={{ padding: "8px" }}>{v.payload_capacity}</td>
                </tr>
              ))}
              {fleet.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 16, color: "#6b7280", textAlign: "center" }}>No vehicles found. Upload fleet data first.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Facilities list */}
        <div style={{ background: "#1a2332", borderRadius: 10, padding: 20, border: "1px solid #2a3342", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>\ud83d\udce6 Facilities</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {(data?.facilities || []).map(f => (
              <div key={f.id} style={{ background: "#111827", borderRadius: 8, padding: 12, border: "1px solid #1f2937" }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: "#8b8d93", marginTop: 4 }}>{f.city} — {f.inventory}/{f.capacity} units ({f.utilization_pct}%)</div>
                <div style={{ marginTop: 6, height: 4, background: "#374151", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${Math.min(f.utilization_pct, 100)}%`, background: f.utilization_pct > 80 ? "#ef4444" : "#10b981", borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{ background: "#1a2332", borderRadius: 10, padding: 20, border: "1px solid #2a3342" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>\ud83d\udcdd Recent Activity</h3>
          {decisions.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: 13 }}>No recent decisions. Activity will appear as your fleet operates.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {decisions.map(d => (
                <div key={d.id} style={{ padding: "8px 12px", background: "#111827", borderRadius: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{d.vehicle}</span>{" "}
                  <span style={{ color: "#94a3b8" }}>{d.action}</span>
                  {d.explanation && <span style={{ color: "#6b7280", marginLeft: 8 }}>{d.explanation}</span>}
                  <span style={{ color: "#4b5563", marginLeft: "auto", float: "right" }}>{d.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
