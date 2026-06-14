import { startTransition, useDeferredValue, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AIRerouteToast } from "./components/common/AIDecisionWidgets";
import { onAuthChange, logout } from "./firebase";
import { LoginView } from "./components/views/LoginView";
import { MapView } from "./components/views/MapView";
import { DashboardView } from "./components/views/DashboardView";
import { LiveOpsView } from "./components/views/LiveOpsView";
import { ForecastView } from "./components/views/ForecastView";
import { InventoryView } from "./components/views/InventoryView";
import { ScenariosView } from "./components/views/ScenariosView";
import { BlockchainView } from "./components/views/BlockchainView";
import { CloudView } from "./components/views/CloudView";
import { NetworkView } from "./components/views/NetworkView";
import { ObjectivesView } from "./components/views/ObjectivesView";
import { EventsView } from "./components/views/EventsView";
import { ImpactView } from "./components/views/ImpactView";
import { SettingsView } from "./components/views/SettingsView";

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

const Icons = {
  Dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>,
  Map: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></svg>,
  LiveOps: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  Forecast: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  Inventory: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  Scenarios: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>,
  Network: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  Objectives: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  Events: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-9 5 18 3-9h6" /></svg>,
  Impact: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>,
  Settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
};

function getNavSections(t) {
  return [
    {
      label: t.operations,
      items: [
        { key: "dashboard", label: t.dashboard, icon: Icons.Dashboard },
        { key: "map", label: t.liveMap, icon: Icons.Map },
        { key: "liveOps", label: t.liveOps, icon: Icons.LiveOps },
      ],
    },
    {
      label: t.intelligence,
      items: [
        { key: "forecast", label: t.forecast, icon: Icons.Forecast },
        { key: "inventory", label: t.inventory, icon: Icons.Inventory },
        { key: "scenarios", label: t.scenarios, icon: Icons.Scenarios },
      ],
    },
    {
      label: t.network,
      items: [
        { key: "network", label: t.networkView, icon: Icons.Network },
        { key: "objectives", label: t.objectives, icon: Icons.Objectives },
        { key: "events", label: t.events, icon: Icons.Events },
      ],
    },
    {
      label: t.analytics,
      items: [
        { key: "impact", label: t.impact, icon: Icons.Impact },
      ],
    },
    {
      label: t.settings,
      items: [
        { key: "settings", label: t.settings, icon: Icons.Settings },
      ],
    },
  ];
}

function Sidebar({ active, onNavigate, collapsed, setCollapsed, t }) {
  const sections = getNavSections(t);
  return (
    <aside
      className={`sidebar ${collapsed ? "collapsed" : "open"}`}
      aria-label="Main navigation"
      onMouseEnter={() => setCollapsed && setCollapsed(false)}
      onMouseLeave={() => setCollapsed && setCollapsed(true)}
    >
      <header className="sidebar-header">
        <div className="logo-mark" aria-hidden="true">SOLV</div>
        {!collapsed && <span className="logo-text">Intelligent Logistics</span>}
      </header>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {sections.map((section) => (
          <div key={section.label} className="nav-section" role="group" aria-label={section.label}>
            {!collapsed && <div className="nav-section-label" aria-hidden="true">{section.label}</div>}
            <ul className="nav-list">
              {section.items.map((item) => (
                <li key={item.key}>
                  <button
                    className={`nav-item ${active === item.key ? "active" : ""}`}
                    onClick={() => onNavigate(item.key)}
                    title={collapsed ? item.label : undefined}
                    aria-current={active === item.key ? "page" : undefined}
                  >
                    <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <footer className="sidebar-footer">
        {!collapsed && <small className="version">{t.version}</small>}
      </footer>
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
    <div className="unified-status-strip" role="status" aria-label="Simulation status" aria-live="polite">
      <div className="status-item live-indicator">
        <span className={`pulse-ring ${sim?.status === "running" ? "active" : ""}`} aria-hidden="true" />
        <span className="status-text">{sim?.status ?? "idle"}</span>
      </div>
      <div className="status-divider" />
      <div className="status-item">
        <span className="status-label">{t.simTime}</span>
        <span className="status-value time-mono">{displayTime?.slice(0, 19).replace("T", " ") ?? "--"}</span>
      </div>
      <div className="status-item">
        <span className="status-label">{t.speed}</span>
        <span className="status-value accent">{sim?.speed_multiplier ?? 0}x</span>
      </div>
      <div className="status-item">
        <span className="status-label">{t.active}</span>
        <span className="status-value">{metrics?.active_trucks ?? 0}</span>
      </div>
      <div className="status-item">
        <span className="status-label">{t.onTime}</span>
        <span className="status-value">{metrics?.on_time_delivery_pct ?? 0}%</span>
      </div>
      <div className="status-item highlight">
        <span className="status-label">{t.co2Saved}</span>
        <span className="status-value">{(metrics?.co2_saved_kg ?? 0).toFixed(1)} kg</span>
      </div>
    </div>
  );
}

function SimControls({ onAction, t }) {
  return (
    <div className="unified-sim-controls" role="group" aria-label="Simulation controls">
      <button className="ctrl-btn play" onClick={() => onAction("/api/simulation/start", { speed_multiplier: 180 }, t.start)} aria-label={`${t.start} simulation`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        {t.start}
      </button>
      <button className="ctrl-btn pause" onClick={() => onAction("/api/simulation/pause", {}, t.pause)} aria-label={`${t.pause} simulation`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
        {t.pause}
      </button>
      <button className="ctrl-btn resume" onClick={() => onAction("/api/simulation/resume", {}, t.resume)} aria-label={`${t.resume} simulation`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
      </button>
      <button className="ctrl-btn reset" onClick={() => onAction("/api/simulation/reset", {}, t.reset)} aria-label={`${t.reset} simulation`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><polyline points="3 3 3 8 8 8" /></svg>
      </button>
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

function formatINRCompact(value) {
  const amount = Number(value || 0);
  if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1000) return `₹${Math.round(amount / 1000)}K`;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function formatDurationFromMinutes(minutes, fallbackHours = 36) {
  const value = Number(minutes);
  const hours = Number.isFinite(value) && value > 0 ? value / 60 : fallbackHours;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

function decisionVerb(action = "") {
  const normalized = String(action || "continue").replaceAll("_", " ");
  if (normalized.includes("reroute")) return "Rerouted";
  if (normalized.includes("wait")) return "Held";
  if (normalized.includes("defer")) return "Deferred";
  return "Optimized";
}

function actionDetail(action = "", explanation = "") {
  const text = String(explanation || "").toLowerCase();
  if (text.includes("port")) return "avoided port delay";
  if (text.includes("risk")) return "reduced route risk";
  if (String(action).includes("rail")) return "switched to rail route for cost efficiency";
  if (String(action).includes("reroute")) return "selected a safer fallback route";
  return "updated route recommendation";
}

function recommendationTime(rec) {
  const raw = rec?.created_at || rec?.simulation_time;
  const date = raw ? new Date(String(raw).endsWith("Z") ? raw : `${raw}Z`) : new Date();
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildDecisionFromRecommendation(rec, metrics) {
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

function buildActivityFeed(recommendations, aiActivity) {
  const fromRecommendations = (recommendations || []).slice(0, 15).map((rec) => ({
    id: `rec-${rec.id}`,
    time: recommendationTime(rec),
    title: `${decisionVerb(rec.action)} SHP-${String(rec.id ?? 0).padStart(3, "0")}`,
    detail: actionDetail(rec.action, rec.explanation),
  }));

  if (fromRecommendations.length) return fromRecommendations;

  return [
    { id: "mock-1", time: "16:23", title: "Rerouted SHP-001", detail: "avoided port delay" },
    { id: "mock-2", time: "16:20", title: "Predicted congestion at Mumbai port", detail: `${aiActivity?.cascade_detections_today ?? 1} cascade signal detected` },
    { id: "mock-3", time: "16:18", title: "Switched to rail route", detail: "optimized for cost efficiency" },
  ];
}

export default function App() {
  const { lang, t, switchLang } = useLanguage();
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
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

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

    // In production, point directly to the Cloud Run backend instead of the Vite proxy
    const backendHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? window.location.host
      : "sim-backend-1029069183045.us-central1.run.app";

    const socket = new WebSocket(`${protocol}://${backendHost}/ws/operations`);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "simulation_snapshot") {
          startTransition(() => { setDashboard(payload.payload); setMetrics(payload.payload.metrics); });
        }
      } catch { }
    };
    const ping = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send("ping"); }, 15000);
    return () => { clearInterval(ping); socket.close(); };
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
      setToasts((prev) => [
        {
          id: `toast-${Date.now()}`,
          type: isReroute ? "reroute" : "info",
          title: isReroute ? "AI Reroute Executed" : "AI Decision Made",
          detail: derivedDecision.impact?.[0]
            ? `${derivedDecision.impact[0]}${derivedDecision.impact[1] ? " · " + derivedDecision.impact[1] : ""}`
            : derivedDecision.reason,
        },
        ...prev.slice(0, 3), // keep at most 4 toasts
      ]);
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

  // Auto-dismiss toasts after 6 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toasts.length]);

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
      <section className="login-view" aria-label="Loading">
        <div className="login-card auth-loading-card">
          <div className="logo-mark large auth-loading-mark" aria-hidden="true">SOLV</div>
          <p className="muted-text" role="status" aria-live="polite">Loading authentication...</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return <LoginView t={t} onLogin={setUser} lang={lang} onSwitchLang={switchLang} />;
  }

  return (
    <div className="app-shell">
      <AIRerouteToast toasts={toasts} onDismiss={dismissToast} />
      <Sidebar active={activeView} onNavigate={setActiveView} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} t={t} />
      <div className={`main-content ${sidebarCollapsed ? "expanded" : ""}`}>
        <header className="unified-app-header" lang={lang} role="banner">
          <div className="header-top-row">
            <div className="header-brand">
              <button className="mobile-menu-btn" onClick={() => setSidebarCollapsed((c) => !c)} aria-label="Toggle navigation menu">☰</button>
              <div className="brand-logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 2 22 22 22" /></svg>
              </div>
              <h1 className="brand-title">{t.commandCenter}</h1>
              <span className="brand-badge">{t.prototypeBadge}</span>
            </div>

            <div className="header-actions">
              <SimControls onAction={runAction} t={t} />
              <div className="header-divider" />
              <div className="user-profile-menu">
                {user.photoURL && <img src={user.photoURL} alt="avatar" className="avatar-img" referrerPolicy="no-referrer" />}
                <span className="user-name-text">{user.displayName?.split(" ")[0] || "Admin"}</span>
                <button className="logout-icon-btn" onClick={handleLogout} aria-label={t.logout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="header-bottom-row">
            <StatusBar dashboard={dashboard} metrics={metrics} t={t} />
          </div>
        </header>
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
