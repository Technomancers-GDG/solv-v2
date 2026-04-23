import { startTransition, useDeferredValue, useEffect, useState, useCallback, useRef } from "react";
import { MapView } from "./components/views/MapView";

const API_BASE = import.meta.env.VITE_API_BASE ?? import.meta.env.VITE_API_BASE_URL ?? "";

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

const NAV_SECTIONS = [
  {
    label: "Operations",
    items: [
      { key: "dashboard", label: "Dashboard", icon: "\uE80F" },
      { key: "map", label: "Live Map", icon: "\uE81D" },
      { key: "liveOps", label: "Live Ops", icon: "\uE8B5" },
      { key: "driverMobile", label: "Driver Mobile", icon: "\uE8CC" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { key: "forecast", label: "Risk Forecast", icon: "\uE8B1" },
      { key: "inventory", label: "Inventory AI", icon: "\uE8F8" },
      { key: "scenarios", label: "Scenarios", icon: "\uE8B8" },
      { key: "blockchain", label: "Audit Chain", icon: "\uE88F" },
    ],
  },
  {
    label: "Network",
    items: [
      { key: "network", label: "Network", icon: "\uE8B4" },
      { key: "objectives", label: "Objectives", icon: "\uE8E5" },
      { key: "events", label: "Events", icon: "\uE8B0" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { key: "impact", label: "Impact & SDG", icon: "\uE8E4" },
      { key: "cloud", label: "Cloud Health", icon: "\uE8BD" },
    ],
  },
];

function Sidebar({ active, onNavigate, collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="logo-mark">SOLV</div>
        {!collapsed && <span className="logo-text">Intelligent Logistics</span>}
        <button className="collapse-btn" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? "\u203A" : "\u2039"}
        </button>
      </div>
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="nav-section">
            {!collapsed && <div className="nav-section-label">{section.label}</div>}
            {section.items.map((item) => (
              <button
                key={item.key}
                className={`nav-item ${active === item.key ? "active" : ""}`}
                onClick={() => onNavigate(item.key)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        {!collapsed && <div className="version">Google Solution Challenge 2026</div>}
      </div>
    </aside>
  );
}

function StatusBar({ dashboard, metrics }) {
  const sim = dashboard?.simulation;
  return (
    <div className="status-bar">
      <div className="status-pill-group">
        <span className={`status-dot ${sim?.status === "running" ? "live" : ""}`} />
        <span className="status-text">{sim?.status ?? "idle"}</span>
      </div>
      <div className="status-pill-group">
        <span className="status-label">Sim Time</span>
        <span className="status-value">{sim?.simulation_time?.slice(0, 19).replace("T", " ") ?? "--"}</span>
      </div>
      <div className="status-pill-group">
        <span className="status-label">Speed</span>
        <span className="status-value">{sim?.speed_multiplier ?? 0}x</span>
      </div>
      <div className="status-pill-group">
        <span className="status-label">Active</span>
        <span className="status-value">{metrics?.active_trucks ?? 0} trucks</span>
      </div>
      <div className="status-pill-group">
        <span className="status-label">On-Time</span>
        <span className="status-value">{metrics?.on_time_delivery_pct ?? 0}%</span>
      </div>
      <div className="status-pill-group">
        <span className="status-label">CO₂ Saved</span>
        <span className="status-value">{(metrics?.co2_saved_kg ?? 0).toFixed(1)} kg</span>
      </div>
    </div>
  );
}

function SimControls({ onAction }) {
  return (
    <div className="sim-controls">
      <button className="sim-btn primary" onClick={() => onAction("/api/simulation/start", { speed_multiplier: 180 }, "Started")}>Start</button>
      <button className="sim-btn" onClick={() => onAction("/api/simulation/pause", {}, "Paused")}>Pause</button>
      <button className="sim-btn" onClick={() => onAction("/api/simulation/resume", {}, "Resumed")}>Resume</button>
      <button className="sim-btn danger" onClick={() => onAction("/api/simulation/reset", {}, "Reset")}>Reset</button>
    </div>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <div className={`panel ${className}`}>
      {title && <div className="panel-header"><h3>{title}</h3></div>}
      <div className="panel-body">{children}</div>
    </div>
  );
}

function MetricCard({ label, value, tone = "neutral", trend }) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {trend !== undefined && <div className="metric-trend">{trend > 0 ? "\u2191" : "\u2193"} {Math.abs(trend).toFixed(1)}%</div>}
    </div>
  );
}

function ProgressBar({ value, compact }) {
  return (
    <div className={`progress-bar ${compact ? "compact" : ""}`}>
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  const start = useCallback((lang = "en-IN") => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, []);

  return { isListening, transcript, start, reset: () => setTranscript("") };
}

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [dashboard, setDashboard] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [events, setEvents] = useState([]);
  const [riskForecast, setRiskForecast] = useState([]);
  const [inventoryForecast, setInventoryForecast] = useState([]);
  const [proactiveDispatches, setProactiveDispatches] = useState([]);
  const [auditChain, setAuditChain] = useState([]);
  const [cloudHealth, setCloudHealth] = useState(null);
  const [blockchainVerify, setBlockchainVerify] = useState(null);
  const [voiceConfig, setVoiceConfig] = useState(null);

  const deferredVehicles = useDeferredValue(dashboard?.vehicles ?? []);

  const refreshAll = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [
        d, f, v, dr, o, r, s, rec, m, e, rf, inv, pd, bc, ch, bv, vc
      ] = await Promise.all([
        apiFetch("/api/dashboard"),
        apiFetch("/api/facilities"),
        apiFetch("/api/vehicles"),
        apiFetch("/api/drivers"),
        apiFetch("/api/objectives"),
        apiFetch("/api/routes"),
        apiFetch("/api/scenarios"),
        apiFetch("/api/recommendations"),
        apiFetch("/api/metrics/sdg"),
        apiFetch("/api/events/news?relevant_only=true"),
        apiFetch("/api/forecast/risk?hours=12").catch(() => []),
        apiFetch("/api/inventory/forecasts").catch(() => []),
        apiFetch("/api/inventory/proactive-dispatches").catch(() => []),
        apiFetch("/api/audit/chain?limit=20").catch(() => []),
        apiFetch("/api/cloud/health").catch(() => null),
        apiFetch("/api/audit/verify").catch(() => null),
        apiFetch("/api/driver/voice-config").catch(() => null),
      ]);
      startTransition(() => {
        setDashboard(d);
        setFacilities(f);
        setVehicles(v);
        setDrivers(dr);
        setObjectives(o);
        setRoutes(r);
        setScenarios(s);
        setRecommendations(rec);
        setMetrics(m);
        setEvents(e);
        setRiskForecast(rf);
        setInventoryForecast(inv);
        setProactiveDispatches(pd);
        setAuditChain(bc);
        setCloudHealth(ch);
        setBlockchainVerify(bv);
        setVoiceConfig(vc);
        setError("");
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshAll(true); const id = setInterval(() => refreshAll(false), 15000); return () => clearInterval(id); }, [refreshAll]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/operations`);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "simulation_snapshot") {
          startTransition(() => { setDashboard(payload.payload); setMetrics(payload.payload.metrics); });
        }
      } catch {}
    };
    const ping = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send("ping"); }, 15000);
    return () => { clearInterval(ping); socket.close(); };
  }, []);

  const runAction = useCallback(async (path, body = null, msg = "") => {
    try {
      await apiFetch(path, { method: "POST", body: JSON.stringify(body ?? {}) });
      if (msg) { setMessage(msg); setError(""); }
      await refreshAll(false);
    } catch (err) { setError(err.message); }
  }, [refreshAll]);

  const facilityLookup = Object.fromEntries(facilities.map((f) => [f.id, f]));
  const driverLookup = Object.fromEntries(drivers.map((d) => [d.id, d]));
  const objectiveLookup = Object.fromEntries(objectives.map((o) => [o.id, o]));
  const criticalFacilities = (dashboard?.facilities ?? []).filter((f) => f.utilization_pct >= 70).slice(0, 6);

  // Voice input hook for driver mobile
  const voice = useVoiceInput();

  const renderDashboard = () => (
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
            <div className="util-list">
              {criticalFacilities.map((f) => (
                <div className="util-item" key={f.facility_id}>
                  <div className="util-meta">
                    <strong>{f.facility_name}</strong>
                    <span>{f.utilization_pct.toFixed(1)}%</span>
                  </div>
                  <ProgressBar value={f.utilization_pct} />
                  <div className="util-foot"><span>{f.city}</span><span>{f.effective_available_units} free</span></div>
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

  const renderMap = () => (
    <MapView
      facilities={facilities}
      vehicles={dashboard?.vehicles ?? []}
      objectives={objectives}
      recommendations={recommendations}
      activeEvents={dashboard?.active_events ?? []}
      routeTemplates={routes}
      riskForecast={riskForecast}
      vehicleCount={dashboard?.vehicles?.length ?? vehicles.length}
      onScaleFleet={(n) => runAction("/api/demo/scale-fleet", { target_vehicle_count: n, reset_simulation: true, auto_start: true, speed_multiplier: 180 })}
    />
  );

  const renderLiveOps = () => (
    <div className="view-liveops">
      <div className="ops-metrics">
        <MetricCard label="Active Trucks" value={metrics?.active_trucks ?? 0} tone="blue" />
        <MetricCard label="Queued" value={metrics?.queued_trucks ?? 0} tone="amber" />
        <MetricCard label="Reroutes" value={metrics?.reroute_count ?? 0} tone="purple" />
        <MetricCard label="Idle Prevented" value={`${(metrics?.idle_minutes_prevented ?? 0).toFixed(0)} min`} tone="green" />
      </div>
      <Panel title="Vehicle Progress">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Vehicle</th><th>Status</th><th>Objective</th><th>Progress</th><th>Payload</th><th>ETA</th><th>AI Action</th></tr></thead>
            <tbody>
              {deferredVehicles.slice(0, 30).map((v) => (
                <tr key={v.vehicle_id}>
                  <td>{v.identifier}</td>
                  <td><span className={`status-badge ${v.status}`}>{v.status}</span></td>
                  <td>{objectiveLookup[v.objective_id]?.name ?? "-"}</td>
                  <td><ProgressBar value={v.progress_pct} compact /></td>
                  <td>{v.payload_units}</td>
                  <td>{v.eta ? v.eta.slice(0, 19).replace("T", " ") : "-"}</td>
                  <td>{v.recommendation_action ?? "continue"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  const renderDriverMobile = () => {
    const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id ?? "");
    const [driverMobile, setDriverMobile] = useState(null);
    const selectedDriver = drivers.find((d) => String(d.id) === String(selectedDriverId));

    useEffect(() => {
      if (!selectedDriverId) return;
      apiFetch(`/api/driver/${selectedDriverId}/mobile`).then(setDriverMobile).catch(() => setDriverMobile(null));
    }, [selectedDriverId, recommendations]);

    useEffect(() => {
      if (voice.transcript) {
        // Simple keyword matching for voice commands
        const text = voice.transcript.toLowerCase();
        const matched = voiceConfig?.incident_types?.find((t) => text.includes(t.label.toLowerCase()) || text.includes(t.key.toLowerCase()));
        if (matched) {
          setVoiceIncidentType(matched.key);
        }
      }
    }, [voice.transcript]);

    const [voiceIncidentType, setVoiceIncidentType] = useState("road_blockage");
    const [voiceNote, setVoiceNote] = useState("");

    const submitVoiceIncident = async () => {
      if (!selectedDriverId) return;
      try {
        await apiFetch("/api/driver/incidents", {
          method: "POST",
          body: JSON.stringify({ driver_profile_id: Number(selectedDriverId), vehicle_id: null, city: "Unknown", incident_type: voiceIncidentType, severity: 0.7, note: voiceNote || voice.transcript || "Voice reported" }),
        });
        setMessage("Voice incident reported.");
        voice.reset();
        setVoiceNote("");
        refreshAll(false);
      } catch (err) { setError(err.message); }
    };

    return (
      <div className="view-driver">
        <div className="driver-grid">
          <Panel title="Driver Selection">
            <select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} className="driver-select">
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} (rating {d.override_rating.toFixed(2)})</option>)}
            </select>
            {selectedDriver && (
              <div className="driver-stats">
                <div><strong>Override Rating:</strong> {selectedDriver.override_rating.toFixed(2)}</div>
                <div><strong>Confidence:</strong> {(selectedDriver.confidence * 100).toFixed(0)}%</div>
                <div><strong>Accept Bias:</strong> {(selectedDriver.accept_recommendation_bias * 100).toFixed(0)}%</div>
              </div>
            )}
          </Panel>
          <Panel title="Voice Incident Reporting">
            <div className="voice-panel">
              <button className={`voice-btn ${voice.isListening ? "listening" : ""}`} onClick={() => voice.start("en-IN")}>
                {voice.isListening ? "\u25CF Listening..." : "\uD83C\uDFA4 Hold to Speak"}
              </button>
              {voice.transcript && (
                <div className="voice-transcript">
                  <strong>Heard:</strong> {voice.transcript}
                </div>
              )}
              <select value={voiceIncidentType} onChange={(e) => setVoiceIncidentType(e.target.value)}>
                {voiceConfig?.incident_types?.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              <input placeholder="Additional notes" value={voiceNote} onChange={(e) => setVoiceNote(e.target.value)} />
              <button onClick={submitVoiceIncident} disabled={!voice.transcript}>Report Incident</button>
            </div>
          </Panel>
          <Panel title="Pending Instructions">
            {driverMobile?.pending_instructions?.length === 0 ? <div className="empty">No pending instructions.</div> : (
              <div className="instruction-list">
                {driverMobile?.pending_instructions?.map((inst) => (
                  <div className="instruction-card" key={inst.recommendation_id}>
                    <div className="inst-header"><strong>{inst.vehicle_identifier}</strong><span>{inst.action.replaceAll("_", " ")}</span></div>
                    <p>{inst.explanation}</p>
                    <div className="inst-actions">
                      <button onClick={async () => { await apiFetch("/api/driver/decision", { method: "POST", body: JSON.stringify({ recommendation_id: inst.recommendation_id, decision: "accepted" }) }); refreshAll(false); }}>Accept</button>
                      <button className="danger" onClick={async () => { await apiFetch("/api/driver/decision", { method: "POST", body: JSON.stringify({ recommendation_id: inst.recommendation_id, decision: "ignored" }) }); refreshAll(false); }}>Ignore</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    );
  };

  const renderForecast = () => (
    <div className="view-forecast">
      <Panel title="Predictive Risk Heatmap (12h forecast)">
        <div className="heatmap-table">
          <table>
            <thead><tr><th>City</th><th>Risk Score</th><th>ETA Multiplier</th><th>Closure Risk</th><th>Confidence</th><th>Contributing Factors</th></tr></thead>
            <tbody>
              {riskForecast.map((rf, i) => (
                <tr key={i} className={`risk-row-${rf.risk > 0.6 ? "high" : rf.risk > 0.3 ? "medium" : "low"}`}>
                  <td><strong>{rf.city}</strong></td>
                  <td>{(rf.risk * 100).toFixed(1)}%</td>
                  <td>{rf.eta_multiplier.toFixed(2)}x</td>
                  <td>{(rf.closure_risk * 100).toFixed(1)}%</td>
                  <td>{(rf.confidence * 100).toFixed(0)}%</td>
                  <td>{rf.factors?.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  const renderInventory = () => (
    <div className="view-inventory">
      <div className="inventory-grid">
        <Panel title="Demand Forecasts">
          <div className="forecast-list">
            {inventoryForecast.map((f, i) => (
              <div className="forecast-card" key={i}>
                <strong>{f.facility_name}</strong>
                <span className={`trend-badge ${f.trend}`}>{f.trend}</span>
                <div className="forecast-stats">
                  <div>Demand: {f.predicted_demand_units} units</div>
                  <div>Safety Stock: {f.safety_stock_units}</div>
                  <div>Reorder Point: {f.reorder_point}</div>
                  <div>Confidence: {(f.confidence * 100).toFixed(0)}%</div>
                </div>
                {f.recommended_dispatch_count > 0 && (
                  <div className="dispatch-alert">
                    Recommend {f.recommended_dispatch_count} dispatch{f.recommended_dispatch_count > 1 ? "es" : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Proactive Dispatch Recommendations">
          {proactiveDispatches.length === 0 ? <div className="empty">All facilities adequately stocked.</div> : (
            <div className="proactive-list">
              {proactiveDispatches.map((d, i) => (
                <div className={`proactive-card urgency-${d.urgency}`} key={i}>
                  <div className="proactive-header">
                    <strong>{facilityLookup[d.destination_facility_id]?.name ?? "Facility"}</strong>
                    <span className={`urgency-tag ${d.urgency}`}>{d.urgency}</span>
                  </div>
                  <p>{d.reason}</p>
                  <div className="proactive-meta">{d.recommended_units} units • ETA {d.eta_hours}h</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );

  const renderBlockchain = () => (
    <div className="view-blockchain">
      <Panel title="Immutable Audit Chain">
        {blockchainVerify && (
          <div className={`chain-status ${blockchainVerify.valid ? "valid" : "invalid"}`}>
            <strong>{blockchainVerify.valid ? "\u2713 Chain Integrity Verified" : "\u26A0 Tampering Detected"}</strong>
            <span>{blockchainVerify.block_count} blocks • Last hash: {(blockchainVerify.last_block_hash ?? "").slice(0, 16)}...</span>
          </div>
        )}
        <div className="chain-list">
          {auditChain.map((b, i) => (
            <div className="chain-block" key={i}>
              <div className="chain-header">
                <span className="chain-index">Block #{b.index}</span>
                <span className="chain-time">{b.timestamp?.slice(0, 19).replace("T", " ")}</span>
              </div>
              <div className="chain-body">
                <div><strong>Type:</strong> {b.decision_type}</div>
                <div><strong>Action:</strong> {b.action}</div>
                <div><strong>Entity:</strong> {b.entity_id}</div>
                <div className="chain-hash" title={b.hash}>Hash: {(b.hash ?? "").slice(0, 20)}...</div>
                <div className="chain-prev" title={b.previous_hash}>Prev: {b.previous_hash?.slice(0, 20)}...</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );

  const renderCloud = () => (
    <div className="view-cloud">
      <Panel title="Google Cloud Integration Health">
        {cloudHealth ? (
          <div className="cloud-grid">
            {Object.entries(cloudHealth).filter(([k]) => k !== "overall").map(([service, info]) => (
              <div className={`cloud-card ${info.enabled ? "enabled" : "disabled"}`} key={service}>
                <strong>{service.replace("_", " ").toUpperCase()}</strong>
                <span>{info.enabled ? "\u2713 Enabled" : "\u25CB Disabled"}</span>
                {info.project && <div className="cloud-meta">Project: {info.project}</div>}
                {info.region && <div className="cloud-meta">Region: {info.region}</div>}
                {info.dataset && <div className="cloud-meta">Dataset: {info.dataset}</div>}
              </div>
            ))}
            <div className={`cloud-overall ${cloudHealth.overall === "healthy" ? "healthy" : "stub"}`}>
              Overall: {cloudHealth.overall}
            </div>
          </div>
        ) : <div className="empty">Cloud health unavailable.</div>}
      </Panel>
    </div>
  );

  const renderNetwork = () => (
    <div className="view-network">
      <div className="grid-two">
        <Panel title="Facilities">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>City</th><th>Type</th><th>Capacity</th><th>Inventory</th></tr></thead>
              <tbody>{facilities.map((f) => (<tr key={f.id}><td>{f.name}</td><td>{f.city}</td><td>{f.facility_type}</td><td>{f.base_capacity_units.toLocaleString()}</td><td>{f.current_inventory_units.toLocaleString()}</td></tr>))}</tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Fleet">
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Type</th><th>Payload</th><th>Speed</th><th>Emission</th><th>Status</th></tr></thead>
              <tbody>{vehicles.map((v) => (<tr key={v.id}><td>{v.identifier}</td><td>{v.vehicle_type}</td><td>{v.payload_capacity_units}</td><td>{v.average_speed_kmph}</td><td>{v.emission_kg_per_km}</td><td>{v.status}</td></tr>))}</tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );

  const renderObjectives = () => (
    <div className="view-objectives">
      <div className="lane-stack">
        {objectives.map((o) => (
          <div className="lane-card" key={o.id}>
            <div className="lane-head"><h3>{o.name}</h3><span className="priority">P{o.priority}</span></div>
            <p>{facilityLookup[o.origin_facility_id]?.city} → {facilityLookup[o.destination_facility_id]?.city}</p>
            <div className="lane-meta">
              <span>{o.commodity}</span>
              <span>{o.dispatch_interval_minutes} min cadence</span>
              <span>{o.assigned_vehicle_ids?.length ?? 0} vehicles</span>
              <span>{o.fallback_facility_ids?.length ?? 0} fallbacks</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="view-events">
      <Panel title="Active Events Feed">
        <div className="event-stack">
          {events.slice(0, 20).map((e, i) => (
            <div className="event-card" key={i}>
              <div className="event-top"><strong>{e.city}</strong><span>{e.category}</span></div>
              <p>{e.headline}</p>
              <small>{e.impact_type} • impact {Number(e.impact_score).toFixed(2)}</small>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );

  const renderScenarios = () => {
    const [selectedKey, setSelectedKey] = useState("");
    const [comparison, setComparison] = useState(null);
    const selected = scenarios.find((s) => s.scenario_key === selectedKey);
    return (
      <div className="view-scenarios">
        <div className="grid-two">
          <Panel title="Scenario Replay">
            <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} className="scenario-select">
              <option value="">Select scenario...</option>
              {scenarios.map((s) => <option key={s.scenario_key} value={s.scenario_key}>{s.name}</option>)}
            </select>
            {selected && (
              <div className="scenario-detail">
                <h4>{selected.name}</h4>
                <p>{selected.description}</p>
                <div className="scenario-meta">{selected.event_city} • severity {selected.severity.toFixed(2)} • ETA x{selected.eta_multiplier.toFixed(2)}</div>
                <div className="scenario-actions">
                  <button onClick={() => runAction(`/api/scenarios/${selected.scenario_key}/trigger`, {}, "Triggered")}>Trigger</button>
                  <button onClick={async () => { const c = await apiFetch(`/api/scenarios/${selected.scenario_key}/compare`); setComparison(c); }}>Compare Baseline vs AI</button>
                </div>
              </div>
            )}
          </Panel>
          <Panel title="Baseline vs AI">
            {!comparison ? <div className="empty">Run comparison to view results.</div> : (
              <div className="comparison-result">
                <div className="comparison-grid">
                  <div><strong>Baseline On-Time</strong><p>{comparison.baseline.on_time_delivery_pct.toFixed(1)}%</p></div>
                  <div><strong>AI On-Time</strong><p>{comparison.ai.on_time_delivery_pct.toFixed(1)}%</p></div>
                  <div><strong>Baseline Delay</strong><p>{comparison.baseline.average_delay_minutes.toFixed(1)} min</p></div>
                  <div><strong>AI Delay</strong><p>{comparison.ai.average_delay_minutes.toFixed(1)} min</p></div>
                </div>
                <div className="comparison-improvement">
                  <span>Overflow reduction: {comparison.improvement_summary?.overflow_reduction?.toFixed(1)}</span>
                  <span>Delay reduction: {comparison.improvement_summary?.delay_reduction_minutes?.toFixed(1)} min</span>
                  <span>Stockouts prevented: {comparison.ai.stockouts_prevented}</span>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    );
  };

  const renderImpact = () => (
    <div className="view-impact">
      <div className="metrics-grid">
        <MetricCard label="CO₂ Saved" value={`${(metrics?.co2_saved_kg ?? 0).toFixed(1)} kg`} tone="green" />
        <MetricCard label="Idle Minutes Prevented" value={`${(metrics?.idle_minutes_prevented ?? 0).toFixed(0)}`} tone="blue" />
        <MetricCard label="On-Time Delivery" value={`${metrics?.on_time_delivery_pct ?? 0}%`} tone="teal" />
        <MetricCard label="Warehouse Utilization" value={`${metrics?.warehouse_utilization_pct ?? 0}%`} tone="amber" />
        <MetricCard label="Critical Deliveries Saved" value={metrics?.critical_deliveries_saved ?? 0} tone="coral" />
        <MetricCard label="Stockouts Prevented" value={metrics?.stockouts_prevented ?? 0} tone="purple" />
      </div>
      <Panel title="SDG Alignment">
        <div className="sdg-grid">
          <div className="sdg-card sdg-9"><strong>SDG 9</strong><span>Industry & Innovation</span><p>AI-driven logistics optimization and predictive analytics</p></div>
          <div className="sdg-card sdg-11"><strong>SDG 11</strong><span>Sustainable Cities</span><p>Reduced congestion and emissions through intelligent routing</p></div>
          <div className="sdg-card sdg-12"><strong>SDG 12</strong><span>Responsible Consumption</span><p>Wastage prevention through demand forecasting</p></div>
          <div className="sdg-card sdg-13"><strong>SDG 13</strong><span>Climate Action</span><p>CO₂ reduction via optimized fleet operations</p></div>
        </div>
      </Panel>
    </div>
  );

  const VIEWS = {
    dashboard: renderDashboard,
    map: renderMap,
    liveOps: renderLiveOps,
    driverMobile: renderDriverMobile,
    forecast: renderForecast,
    inventory: renderInventory,
    scenarios: renderScenarios,
    blockchain: renderBlockchain,
    network: renderNetwork,
    objectives: renderObjectives,
    events: renderEvents,
    impact: renderImpact,
    cloud: renderCloud,
  };

  return (
    <div className="app-shell">
      <Sidebar active={activeView} onNavigate={setActiveView} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
      <div className={`main-content ${sidebarCollapsed ? "expanded" : ""}`}>
        <header className="top-bar">
          <div className="top-bar-left">
            <h1>Command Center</h1>
          </div>
          <div className="top-bar-right">
            <SimControls onAction={runAction} />
          </div>
        </header>
        <StatusBar dashboard={dashboard} metrics={metrics} />
        {message && <div className="banner success">{message}</div>}
        {error && <div className="banner error">{error}</div>}
        {loading && !dashboard ? <div className="loading">Loading intelligence layer...</div> : (
          <main className="view-area">
            {(VIEWS[activeView] || VIEWS.dashboard)()}
          </main>
        )}
      </div>
    </div>
  );
}
