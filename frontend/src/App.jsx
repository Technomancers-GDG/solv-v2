import { startTransition, useDeferredValue, useEffect, useState, useCallback, useRef } from "react";
import { MapView } from "./components/views/MapView";
import { DashboardView } from "./components/views/DashboardView";
import { LiveOpsView } from "./components/views/LiveOpsView";
import { DriverMobileView } from "./components/views/DriverMobileView";
import { ForecastView } from "./components/views/ForecastView";
import { InventoryView } from "./components/views/InventoryView";
import { ScenariosView } from "./components/views/ScenariosView";
import { BlockchainView } from "./components/views/BlockchainView";
import { CloudView } from "./components/views/CloudView";
import { NetworkView } from "./components/views/NetworkView";
import { ObjectivesView } from "./components/views/ObjectivesView";
import { EventsView } from "./components/views/EventsView";
import { ImpactView } from "./components/views/ImpactView";

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
  const [displayTime, setDisplayTime] = useState(sim?.simulation_time);

  useEffect(() => {
    setDisplayTime(sim?.simulation_time);
  }, [sim?.simulation_time]);

  useEffect(() => {
    if (sim?.status !== "running" || !sim?.simulation_time || !sim?.speed_multiplier) return;

    let lastTick = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dtSec = (now - lastTick) / 1000;
      lastTick = now;

      setDisplayTime(prev => {
        if (!prev) return prev;
        // Parse time robustly by assuming it's UTC so local timezone doesn't shift the hours
        const d = new Date(prev.endsWith("Z") ? prev : prev + "Z");
        if (isNaN(d.getTime())) return prev;
        d.setMilliseconds(d.getMilliseconds() + dtSec * sim.speed_multiplier * 1000);
        return d.toISOString().replace("Z", "");
      });
    }, 100);

    return () => clearInterval(interval);
  }, [sim?.status, sim?.simulation_time, sim?.speed_multiplier]);

  return (
    <div className="status-bar">
      <div className="status-pill-group">
        <span className={`status-dot ${sim?.status === "running" ? "live" : ""}`} />
        <span className="status-text">{sim?.status ?? "idle"}</span>
      </div>
      <div className="status-pill-group">
        <span className="status-label">Sim Time</span>
        <span className="status-value">{displayTime?.slice(0, 19).replace("T", " ") ?? "--"}</span>
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
  const [scenarioKey, setScenarioKey] = useState("");
  const [scenarioComparison, setScenarioComparison] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [driverMobile, setDriverMobile] = useState(null);
  const [voiceIncidentType, setVoiceIncidentType] = useState("road_blockage");
  const [voiceNote, setVoiceNote] = useState("");

  const deferredVehicles = useDeferredValue(dashboard?.vehicles ?? []);
  const voice = useVoiceInput();

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
    if (!selectedDriverId) return;
    apiFetch(`/api/driver/${selectedDriverId}/mobile`).then(setDriverMobile).catch(() => setDriverMobile(null));
  }, [selectedDriverId, recommendations]);

  useEffect(() => {
    if (voice.transcript) {
      const text = voice.transcript.toLowerCase();
      const matched = voiceConfig?.incident_types?.find((t) => text.includes(t.label.toLowerCase()) || text.includes(t.key.toLowerCase()));
      if (matched) setVoiceIncidentType(matched.key);
    }
  }, [voice.transcript]);

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
  const objectiveLookup = Object.fromEntries(objectives.map((o) => [o.id, o]));
  const criticalFacilities = (dashboard?.facilities ?? []).filter((f) => f.utilization_pct >= 70).slice(0, 6);

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView metrics={metrics} criticalFacilities={criticalFacilities} proactiveDispatches={proactiveDispatches} riskForecast={riskForecast} auditChain={auditChain} blockchainVerify={blockchainVerify} facilityLookup={facilityLookup} />;
      case "map":
        return <MapView facilities={facilities} vehicles={dashboard?.vehicles ?? []} objectives={objectives} recommendations={recommendations} activeEvents={dashboard?.active_events ?? []} routeTemplates={routes} riskForecast={riskForecast} vehicleCount={dashboard?.vehicles?.length ?? vehicles.length} onScaleFleet={(n) => runAction("/api/demo/scale-fleet", { target_vehicle_count: n, reset_simulation: true, auto_start: true, speed_multiplier: 180 })} />;
      case "liveOps":
        return <LiveOpsView metrics={metrics} deferredVehicles={deferredVehicles} objectiveLookup={objectiveLookup} />;
      case "driverMobile":
        return <DriverMobileView drivers={drivers} selectedDriverId={selectedDriverId} setSelectedDriverId={setSelectedDriverId} driverMobile={driverMobile} voice={voice} voiceConfig={voiceConfig} voiceIncidentType={voiceIncidentType} setVoiceIncidentType={setVoiceIncidentType} voiceNote={voiceNote} setVoiceNote={setVoiceNote} onMessage={setMessage} onError={setError} refreshAll={refreshAll} apiFetch={apiFetch} />;
      case "forecast":
        return <ForecastView riskForecast={riskForecast} />;
      case "inventory":
        return <InventoryView inventoryForecast={inventoryForecast} proactiveDispatches={proactiveDispatches} facilityLookup={facilityLookup} />;
      case "scenarios":
        return <ScenariosView scenarios={scenarios} scenarioKey={scenarioKey} setScenarioKey={setScenarioKey} scenarioComparison={scenarioComparison} setScenarioComparison={setScenarioComparison} runAction={runAction} apiFetch={apiFetch} />;
      case "blockchain":
        return <BlockchainView auditChain={auditChain} blockchainVerify={blockchainVerify} />;
      case "network":
        return <NetworkView facilities={facilities} vehicles={vehicles} />;
      case "objectives":
        return <ObjectivesView objectives={objectives} facilityLookup={facilityLookup} />;
      case "events":
        return <EventsView events={events} />;
      case "impact":
        return <ImpactView metrics={metrics} />;
      case "cloud":
        return <CloudView cloudHealth={cloudHealth} />;
      default:
        return <DashboardView metrics={metrics} criticalFacilities={criticalFacilities} proactiveDispatches={proactiveDispatches} riskForecast={riskForecast} auditChain={auditChain} blockchainVerify={blockchainVerify} facilityLookup={facilityLookup} />;
    }
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
            {renderView()}
          </main>
        )}
      </div>
    </div>
  );
}
