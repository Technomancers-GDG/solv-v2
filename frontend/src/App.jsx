import { lazy, Suspense, Component, startTransition, useDeferredValue, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AIRerouteToast } from "./components/common/AIDecisionWidgets";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { onAuthChange, logout } from "./firebase";
import { LoginView } from "./components/views/LoginView";

const DashboardView = lazy(() => import("./components/views/DashboardView").then(m => ({ default: m.DashboardView })));
const MapView = lazy(() => import("./components/views/MapView").then(m => ({ default: m.MapView })));
const LiveOpsView = lazy(() => import("./components/views/LiveOpsView").then(m => ({ default: m.LiveOpsView })));
const ForecastView = lazy(() => import("./components/views/ForecastView").then(m => ({ default: m.ForecastView })));
const InventoryView = lazy(() => import("./components/views/InventoryView").then(m => ({ default: m.InventoryView })));
const ScenariosView = lazy(() => import("./components/views/ScenariosView").then(m => ({ default: m.ScenariosView })));
const BlockchainView = lazy(() => import("./components/views/BlockchainView").then(m => ({ default: m.BlockchainView })));
const CloudView = lazy(() => import("./components/views/CloudView").then(m => ({ default: m.CloudView })));
const NetworkView = lazy(() => import("./components/views/NetworkView").then(m => ({ default: m.NetworkView })));
const ObjectivesView = lazy(() => import("./components/views/ObjectivesView").then(m => ({ default: m.ObjectivesView })));
const EventsView = lazy(() => import("./components/views/EventsView").then(m => ({ default: m.EventsView })));
const ImpactView = lazy(() => import("./components/views/ImpactView").then(m => ({ default: m.ImpactView })));
const SettingsView = lazy(() => import("./components/views/SettingsView").then(m => ({ default: m.SettingsView })));

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

const TRANSLATIONS = {
  en: {
    operations: "Operations",
    intelligence: "Intelligence",
    network: "Network",
    analytics: "Analytics",
    settings: "Settings",
    dashboard: "Dashboard",
    liveMap: "Live Map",
    liveOps: "Live Ops",
    forecast: "Risk Forecast",
    inventory: "Inventory AI",
    scenarios: "Scenarios",
    blockchain: "Blockchain",
    networkView: "Network",
    objectives: "Objectives",
    events: "Events",
    impact: "Impact & SDG",
    cloud: "Cloud",
    commandCenter: "Command Center",
    prototypeBadge: "Hackathon Prototype",
    simTime: "Sim Time",
    speed: "Speed",
    active: "Active",
    onTime: "On-Time",
    co2Saved: "CO₂ Saved",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    language: "Language",
    english: "English",
    hindi: "Hindi",
    version: "Google Solution Challenge 2026",
    welcome: "Welcome to SOLV",
    loginTagline: "Intelligent Essential Goods Logistics",
    signInWithGoogle: "Sign in with Google",
    logout: "Logout",
  },
  hi: {
    operations: "संचालन",
    intelligence: "खुफिया",
    network: "नेटवर्क",
    analytics: "विश्लेषण",
    settings: "सेटिंग्स",
    dashboard: "डैशबोर्ड",
    liveMap: "लाइव मानचित्र",
    liveOps: "लाइव संचालन",
    forecast: "जोखिम पूर्वानुमान",
    inventory: "इन्वेंटरी AI",
    scenarios: "परिदृश्य",
    blockchain: "ब्लॉकचेन",
    networkView: "नेटवर्क",
    objectives: "उद्देश्य",
    events: "घटनाएँ",
    impact: "प्रभाव और SDG",
    cloud: "क्लाउड",
    commandCenter: "कमांड केंद्र",
    prototypeBadge: "हैकथॉन प्रोटोटाइप",
    simTime: "सिम समय",
    speed: "गति",
    active: "सक्रिय",
    onTime: "समय पर",
    co2Saved: "CO₂ बचत",
    start: "प्रारंभ",
    pause: "रोकें",
    resume: "फिर से शुरू",
    reset: "रीसेट",
    language: "भाषा",
    english: "अंग्रेज़ी",
    hindi: "हिंदी",
    version: "Google Solution Challenge 2026",
    welcome: "SOLV में आपका स्वागत है",
    loginTagline: "बुद्धिमान आवश्यक वस्तु लॉजिस्टिक्स",
    signInWithGoogle: "Google से साइन इन करें",
    logout: "लॉग आउट",
  },
};

function useLanguage() {
  const [lang, setLang] = useState(() => localStorage.getItem("solv-lang") || "en");
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const switchLang = (next) => {
    setLang(next);
    localStorage.setItem("solv-lang", next);
  };
  return { lang, t, switchLang };
}

function getNavSections(t) {
  return [
    {
      label: t.operations,
      items: [
        { key: "dashboard", label: t.dashboard, icon: "📊" },
        { key: "map", label: t.liveMap, icon: "🗺️" },
        { key: "liveOps", label: t.liveOps, icon: "⚡" },
      ],
    },
    {
      label: t.intelligence,
      items: [
        { key: "forecast", label: t.forecast, icon: "🔮" },
        { key: "inventory", label: t.inventory, icon: "📦" },
        { key: "scenarios", label: t.scenarios, icon: "🎬" },
      ],
    },
    {
      label: t.network,
      items: [
        { key: "network", label: t.networkView, icon: "🌐" },
        { key: "objectives", label: t.objectives, icon: "🎯" },
        { key: "events", label: t.events, icon: "📡" },
      ],
    },
    {
      label: t.analytics,
      items: [
        { key: "impact", label: t.impact, icon: "🌍" },
      ],
    },
    {
      label: t.settings,
      items: [
        { key: "settings", label: t.settings, icon: "⚙️" },
      ],
    },
  ];
}

function Sidebar({ active, onNavigate, collapsed, onToggle, t }) {
  const sections = getNavSections(t);
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : "open"}`}>
      <div className="sidebar-header">
        <div className="logo-mark">SOLV</div>
        {!collapsed && <span className="logo-text">Intelligent Logistics</span>}
        <button className="collapse-btn" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? "\u203A" : "\u2039"}
        </button>
      </div>
      <nav className="sidebar-nav">
        {sections.map((section) => (
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
        {!collapsed && <div className="version">{t.version}</div>}
      </div>
    </aside>
  );
}

function StatusBar({ dashboard, metrics, t }) {
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
        <span className="status-label">{t.simTime}</span>
        <span className="status-value">{displayTime?.slice(0, 19).replace("T", " ") ?? "--"}</span>
      </div>
      <div className="status-pill-group">
        <span className="status-label">{t.speed}</span>
        <span className="status-value">{sim?.speed_multiplier ?? 0}x</span>
      </div>
      <div className="status-pill-group">
        <span className="status-label">{t.active}</span>
        <span className="status-value">{metrics?.active_trucks ?? 0} trucks</span>
      </div>
      <div className="status-pill-group">
        <span className="status-label">{t.onTime}</span>
        <span className="status-value">{metrics?.on_time_delivery_pct ?? 0}%</span>
      </div>
      <div className="status-pill-group">
        <span className="status-label">{t.co2Saved}</span>
        <span className="status-value">{(metrics?.co2_saved_kg ?? 0).toFixed(1)} kg</span>
      </div>
    </div>
  );
}

function SimControls({ onAction, t }) {
  return (
    <div className="sim-controls">
      <button className="sim-btn primary" onClick={() => onAction("/api/simulation/start", { speed_multiplier: 180 }, t.start)}>{t.start}</button>
      <button className="sim-btn" onClick={() => onAction("/api/simulation/pause", {}, t.pause)}>{t.pause}</button>
      <button className="sim-btn" onClick={() => onAction("/api/simulation/resume", {}, t.resume)}>{t.resume}</button>
      <button className="sim-btn danger" onClick={() => onAction("/api/simulation/reset", {}, t.reset)}>{t.reset}</button>
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

export function formatINRCompact(value) {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1000) return `₹${Math.round(amount / 1000)}K`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function formatDurationFromMinutes(minutes, fallbackHours = 36) {
  const value = Number(minutes);
  const hours = Number.isFinite(value) && value > 0 ? value / 60 : fallbackHours;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

export function decisionVerb(action = "") {
  const normalized = String(action || "continue").replaceAll("_", " ");
  if (normalized.includes("reroute")) return "Rerouted";
  if (normalized.includes("wait")) return "Held";
  if (normalized.includes("defer")) return "Deferred";
  return "Optimized";
}

export function actionDetail(action = "", explanation = "") {
  const text = String(explanation || "").toLowerCase();
  if (text.includes("port")) return "avoided port delay";
  if (text.includes("risk")) return "reduced route risk";
  if (String(action).includes("rail")) return "switched to rail route for cost efficiency";
  if (String(action).includes("reroute")) return "selected a safer fallback route";
  return "updated route recommendation";
}

export function recommendationTime(rec) {
  const raw = rec?.created_at || rec?.simulation_time;
  const date = raw ? new Date(String(raw).endsWith("Z") ? raw : `${raw}Z`) : new Date();
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function buildDecisionFromRecommendation(rec, metrics) {
  if (!rec) {
    const saved = Number(metrics?.financial_costs_saved_usd ?? 25000);
    return {
      id: "mock-decision",
      title: "Rerouted Shipment SHP-001",
      reason: "Predicted 10-hour delay at Chennai Port",
      impact: [`${formatINRCompact(saved || 25000)} cost saved`, "6 hours faster delivery"],
      confidence: 92,
      comparison: {
        before: { label: "Route A", cost: "₹1.2L", time: "36h" },
        after: { label: "Route B", cost: "₹95K", time: "30h" },
        decision: "Chosen to minimize cost and avoid delay risk",
      },
    };
  }

  const shipmentRef = `SHP-${String(rec.id ?? 1).padStart(3, "0")}`;
  const costSaved = Number(rec.financial_impact_usd ?? 0) || Math.max(0, Number(rec.baseline_cost ?? 0) - Number(rec.recommended_cost ?? 0));
  const addedTravel = Number(rec.score_breakdown?.added_travel_minutes ?? 0);
  const baselineMinutes = Number(rec.score_breakdown?.baseline_duration_minutes ?? 2160);
  const recommendedMinutes = Math.max(60, baselineMinutes + addedTravel);
  const timeSaved = Math.max(0, baselineMinutes - recommendedMinutes);
  const confidence = Math.round((Number(rec.confidence ?? 0.9) || 0.9) * 100);

  return {
    id: rec.id,
    title: `${decisionVerb(rec.action)} Shipment ${shipmentRef}`,
    reason: rec.explanation || "AI selected the best route after evaluating cost, capacity, and route risk.",
    impact: [
      `${formatINRCompact(costSaved)} cost saved`,
      timeSaved > 0 ? `${formatDurationFromMinutes(timeSaved, 6)} faster delivery` : "delay risk avoided",
    ],
    confidence,
    comparison: {
      before: {
        label: "Route A",
        cost: formatINRCompact(rec.baseline_cost ?? costSaved * 1.2),
        time: formatDurationFromMinutes(baselineMinutes, 36),
      },
      after: {
        label: "Route B",
        cost: formatINRCompact(rec.recommended_cost ?? Math.max(0, Number(rec.baseline_cost ?? 0) - costSaved)),
        time: formatDurationFromMinutes(recommendedMinutes, 30),
      },
      decision: rec.action?.includes("reroute")
        ? "Chosen to minimize cost and avoid delay risk"
        : "Chosen as the lowest-risk feasible option",
    },
  };
}

export function buildActivityFeed(recommendations, _aiActivity) {
  const fromRecommendations = (recommendations || []).slice(0, 15).map((rec) => ({
    id: `rec-${rec.id}`,
    time: recommendationTime(rec),
    title: `${decisionVerb(rec.action)} SHP-${String(rec.id ?? 0).padStart(3, "0")}`,
    detail: actionDetail(rec.action, rec.explanation),
  }));

  return fromRecommendations;
}

export default function App() {
  const { lang, t, switchLang } = useLanguage();
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setUser({ displayName: 'Test User', email: 'test@example.com' });
    setAuthReady(true);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setActiveView("dashboard");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

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
  const [aiActivity, setAiActivity] = useState(null);
  const [latestDecision, setLatestDecision] = useState(null);
  const [previousRoute, setPreviousRoute] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [toasts, setToasts] = useState([]);
  const seenDecisionIds = useRef(new Set());
  const [scenarioKey, setScenarioKey] = useState("");
  const [scenarioComparison, setScenarioComparison] = useState(null);
  const [scalingFleet, setScalingFleet] = useState(false);
  const [voiceIncidentType, setVoiceIncidentType] = useState("road_blockage");
  const [voiceNote, setVoiceNote] = useState("");

  const deferredVehicles = useDeferredValue(dashboard?.vehicles ?? []);
  const voice = useVoiceInput();

  const refreshAll = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [
        d, f, v, dr, o, r, s, rec, m, e, rf, inv, pd, ai
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
        apiFetch("/api/metrics/ai-activity").catch(() => null),
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
        setAiActivity(ai);
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
    if (voice.transcript) {
      const text = voice.transcript.toLowerCase();
      const matched = voiceConfig?.incident_types?.find((t) => text.includes(t.label.toLowerCase()) || text.includes(t.key.toLowerCase()));
      if (matched) setVoiceIncidentType(matched.key);
    }
  }, [voice.transcript]);

  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    let socket;
    let pingTimer;
    let reconnectTimer;

    function connectWs() {
      const wsBase = import.meta.env.VITE_WS_BASE_URL ||
        `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;

      socket = new WebSocket(`${wsBase}/ws/operations`);

      socket.onopen = () => {
        setWsConnected(true);
        pingTimer = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send("ping"); }, 15000);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "simulation_snapshot") {
            startTransition(() => { setDashboard(payload.payload); setMetrics(payload.payload.metrics); });
          }
        } catch {}
      };

      socket.onclose = () => {
        setWsConnected(false);
        clearInterval(pingTimer);
        reconnectTimer = setTimeout(connectWs, 3000);
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connectWs();

    return () => {
      clearInterval(pingTimer);
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);
  const runAction = useCallback(async (path, body = null, msg = "") => {
    try {
      await apiFetch(path, { method: "POST", body: JSON.stringify(body ?? {}) });
      if (msg) { 
        setMessage(msg); 
        setError(""); 
        setTimeout(() => setMessage(""), 3000);
      }
      await refreshAll(false);
    } catch (err) { setError(err.message); }
  }, [refreshAll]);

  const facilityLookup = Object.fromEntries(facilities.map((f) => [f.id, f]));
  const objectiveLookup = Object.fromEntries(objectives.map((o) => [o.id, o]));
  const criticalFacilities = (dashboard?.facilities ?? []).filter((f) => f.utilization_pct >= 70).slice(0, 6);
  const derivedDecision = useMemo(
    () => buildDecisionFromRecommendation(recommendations?.[0], metrics),
    [recommendations, metrics]
  );
  const derivedActivityFeed = useMemo(
    () => buildActivityFeed(recommendations, aiActivity),
    [recommendations, aiActivity]
  );

  useEffect(() => {
    if (!derivedDecision) return;
    const id = String(derivedDecision.id ?? derivedDecision.title ?? "");
    if (id && !seenDecisionIds.current.has(id) && seenDecisionIds.current.size > 0) {
      // New decision arrived — fire a toast
      const isReroute = String(derivedDecision.title ?? "").toLowerCase().includes("rerouted");
      const toastId = `toast-${Date.now()}`;
      setToasts((prev) => [
        {
          id: toastId,
          type: isReroute ? "reroute" : "info",
          title: isReroute ? "⚠ AI Reroute Executed" : "🧠 AI Decision Made",
          detail: derivedDecision.impact?.[0]
            ? `${derivedDecision.impact[0]}${derivedDecision.impact[1] ? " · " + derivedDecision.impact[1] : ""}`
            : derivedDecision.reason,
        },
        ...prev.slice(0, 3), // keep at most 4 toasts
      ]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 6000);
    }
    if (id) seenDecisionIds.current.add(id);
    setLatestDecision(derivedDecision);
    setPreviousRoute(derivedDecision?.comparison?.before ?? null);
  }, [derivedDecision]);

  useEffect(() => {
    setActivityFeed(derivedActivityFeed.slice(0, 20));
  }, [derivedActivityFeed]);

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);



  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView metrics={metrics} criticalFacilities={criticalFacilities} proactiveDispatches={proactiveDispatches} riskForecast={riskForecast} auditChain={auditChain} blockchainVerify={blockchainVerify} facilityLookup={facilityLookup} aiActivity={aiActivity} latestDecision={latestDecision} previousRoute={previousRoute} activityFeed={activityFeed} />;
      case "map":
        return <MapView facilities={facilities} vehicles={dashboard?.vehicles ?? []} objectives={objectives} recommendations={recommendations} activeEvents={dashboard?.active_events ?? []} routeTemplates={routes} riskForecast={riskForecast} vehicleCount={dashboard?.vehicles?.length ?? vehicles.length} onScaleFleet={async (n) => { setScalingFleet(true); try { await runAction("/api/demo/scale-fleet", { target_vehicle_count: n, reset_simulation: true, auto_start: true, speed_multiplier: 180 }); } finally { setScalingFleet(false); } }} isScalingFleet={scalingFleet} />;
      case "liveOps":
        return <LiveOpsView metrics={metrics} deferredVehicles={deferredVehicles} objectiveLookup={objectiveLookup} />;
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
      case "settings":
        return <SettingsView lang={lang} onSwitchLang={switchLang} t={t} />;
      default:
        return <DashboardView metrics={metrics} criticalFacilities={criticalFacilities} proactiveDispatches={proactiveDispatches} riskForecast={riskForecast} auditChain={auditChain} blockchainVerify={blockchainVerify} facilityLookup={facilityLookup} aiActivity={aiActivity} latestDecision={latestDecision} previousRoute={previousRoute} activityFeed={activityFeed} />;
    }
  };

  if (!authReady) {
    return (
      <div className="login-view">
        <div className="login-card" style={{ textAlign: "center" }}>
          <div className="logo-mark large" style={{ margin: "0 auto 16px" }}>SOLV</div>
          <p style={{ color: "#8b8d93" }}>Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView t={t} onLogin={setUser} lang={lang} onSwitchLang={switchLang} />;
  }

  return (
    <div className="app-shell">
      <AIRerouteToast toasts={toasts} onDismiss={dismissToast} />
      <Sidebar active={activeView} onNavigate={setActiveView} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} t={t} />
      <div className={`main-content ${sidebarCollapsed ? "expanded" : ""}`}>
        <header className="top-bar" lang={lang}>
          <div className="top-bar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <h1>{t.commandCenter}</h1>
            <span className="prototype-badge">{t.prototypeBadge}</span>
            <div style={{ marginLeft: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ 
                display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", 
                backgroundColor: wsConnected ? "#10b981" : "#ef4444",
                boxShadow: wsConnected ? "0 0 8px #10b981" : "0 0 8px #ef4444"
              }} title={wsConnected ? "Connected to Backend" : "Disconnected (Auto-reconnecting...)"} />
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{wsConnected ? "Live" : "Reconnecting..."}</span>
            </div>
          </div>
          <div className="top-bar-right">
            <div className="user-chip">
              {user.photoURL && (
                <img src={user.photoURL} alt="" className="user-avatar" referrerPolicy="no-referrer" />
              )}
              <span className="user-name">{user.displayName || user.email || "User"}</span>
              <button className="logout-btn" onClick={handleLogout} title={t.logout}>
                {t.logout}
              </button>
            </div>
            <SimControls onAction={runAction} t={t} />
          </div>
        </header>
        <StatusBar dashboard={dashboard} metrics={metrics} t={t} />
        {message && <div className="banner success">{message}</div>}
        {error && <div className="banner error">{error}</div>}
        {loading && !dashboard ? <div className="loading">Loading intelligence layer...</div> : (
          <main className="view-area">
            <ErrorBoundary key={activeView}>
              <Suspense fallback={<div className="loading">Loading...</div>}>
                {renderView()}
              </Suspense>
            </ErrorBoundary>
          </main>
        )}
      </div>
    </div>
  );
}
