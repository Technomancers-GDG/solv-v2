import { useState, useEffect, useCallback, useMemo, useRef, startTransition, useDeferredValue, lazy, Suspense, Component } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AIRerouteToast } from "./components/common/AIDecisionWidgets";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AIChatPanel } from "./components/common/AIChatPanel";
import { onAuthChange, logout } from "./firebase";
import { LoginView } from "./components/views/LoginView";
import { LandingView } from "./components/landing/LandingView";

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
const RLTrainingView = lazy(() => import("./components/views/RLTrainingView").then(m => ({ default: m.RLTrainingView })));
const AIExplainerView = lazy(() => import("./components/views/AIExplainerView").then(m => ({ default: m.AIExplainerView })));
const ComparisonView = lazy(() => import("./components/views/ComparisonView").then(m => ({ default: m.ComparisonView })));

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
    aiIntelligence: "AI Intelligence",
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
    rlTraining: "RL Training",
    aiExplainer: "AI Decisions",
    aiComparison: "AI vs Baseline",
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
    welcome: "Welcome to Logisight",
    loginTagline: "Intelligent Essential Goods Logistics",
    signInWithGoogle: "Sign in with Google",
    logout: "Logout",
  },
  hi: {
    operations: "संचालन",
    intelligence: "खुफिया",
    aiIntelligence: "AI खुफिया",
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
    rlTraining: "RL प्रशिक्षण",
    aiExplainer: "AI निर्णय",
    aiComparison: "AI बनाम आधारभूत",
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
    welcome: "Logisight में आपका स्वागत है",
    loginTagline: "बुद्धिमान आवश्यक वस्तु लॉजिस्टिक्स",
    signInWithGoogle: "Google से साइन इन करें",
    logout: "लॉग आउट",
  },
};

function useLanguage() {
  const [lang, setLang] = useState(() => localStorage.getItem("logisight-lang") || "en");
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const switchLang = (next) => {
    setLang(next);
    localStorage.setItem("logisight-lang", next);
  };
  return { lang, t, switchLang };
}

const IconSVG = ({ type }) => {
  const paths = {
    dashboard: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    map: "M9 20l-5 -3v-12l5 3M15 4l5 3v12l-5 -3M9 20v-12M15 4v12",
    liveOps: "M13 10V3L4 14h7v7l9-11h-7z",
    forecast: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    inventory: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    scenarios: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",
    rlTraining: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    aiExplainer: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    aiComparison: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    networkView: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
    objectives: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    events: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    impact: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[type] || paths.dashboard} />
    </svg>
  );
};

function getNavSections(t) {
  return [
    {
      label: t.operations,
      items: [
        { key: "dashboard", label: t.dashboard, icon: <IconSVG type="dashboard" /> },
        { key: "map", label: t.liveMap, icon: <IconSVG type="map" /> },
        { key: "liveOps", label: t.liveOps, icon: <IconSVG type="liveOps" /> },
      ],
    },
    {
      label: t.intelligence,
      items: [
        { key: "forecast", label: t.forecast, icon: <IconSVG type="forecast" /> },
        { key: "inventory", label: t.inventory, icon: <IconSVG type="inventory" /> },
        { key: "scenarios", label: t.scenarios, icon: <IconSVG type="scenarios" /> },
      ],
    },
    {
      label: t.aiIntelligence,
      items: [
        { key: "rlTraining", label: t.rlTraining, icon: <IconSVG type="rlTraining" /> },
        { key: "aiExplainer", label: t.aiExplainer, icon: <IconSVG type="aiExplainer" /> },
        { key: "aiComparison", label: t.aiComparison, icon: <IconSVG type="aiComparison" /> },
      ],
    },
    {
      label: t.network,
      items: [
        { key: "network", label: t.networkView, icon: <IconSVG type="networkView" /> },
        { key: "objectives", label: t.objectives, icon: <IconSVG type="objectives" /> },
        { key: "events", label: t.events, icon: <IconSVG type="events" /> },
      ],
    },
    {
      label: t.analytics,
      items: [
        { key: "impact", label: t.impact, icon: <IconSVG type="impact" /> },
      ],
    },
    {
      label: t.settings,
      items: [
        { key: "settings", label: t.settings, icon: <IconSVG type="settings" /> },
      ],
    },
  ];
}

function Sidebar({ active, onNavigate, t }) {
  const [isHovered, setIsHovered] = useState(false);
  const sections = getNavSections(t);
  return (
    <aside 
      className={`sidebar ${isHovered ? "open" : "collapsed"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="sidebar-header">
        <div className="logo-mark">L</div>
        {isHovered && <span className="logo-text">Logisight</span>}
      </div>
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.label} className="nav-section">
            {isHovered && <div className="nav-section-label">{section.label}</div>}
            {section.items.map((item) => (
              <button
                key={item.key}
                className={`nav-item ${active === item.key ? "active" : ""}`}
                onClick={() => onNavigate(item.key)}
                title={!isHovered ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {isHovered && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        {isHovered && <div className="version">{t.version}</div>}
      </div>
    </aside>
  );
}

function StatusBar({ dashboard, metrics, t }) {
  const sim = dashboard?.simulation;
  const [displayTime, setDisplayTime] = useState(sim?.simulation_time);
  const speedRef = useRef(sim?.speed_multiplier ?? 1);

  useEffect(() => {
    speedRef.current = sim?.speed_multiplier ?? 1;
  }, [sim?.speed_multiplier]);

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
        d.setMilliseconds(d.getMilliseconds() + dtSec * speedRef.current * 1000);
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
        <span className="status-value">{sim?.speed_multiplier ?? 0}x{(sim?.speed_multiplier ?? 0) >= 5000 ? <span className="turbo-badge"> TURBO</span> : ""}</span>
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

function SimControls({ onAction, onSetSpeed, currentSpeed, t }) {
  return (
    <div className="sim-controls">
      <button className="sim-btn" onClick={() => onAction("/api/simulation/start", { speed_multiplier: 120 }, t.start)}>▶ Start</button>
      <button className="sim-btn" onClick={() => onAction("/api/simulation/pause", {}, t.pause)}>⏸ Pause</button>
      <button className="sim-btn" onClick={() => onAction("/api/simulation/reset", {}, t.reset)} title="Reset">↺</button>
      <button className="sim-btn" onClick={() => onAction("/api/simulation/resume", {}, t.resume)} title="Resume">↻</button>
      <span className="sim-btn" style={{border: 'none', background: 'transparent', fontWeight: '800'}}>Local</span>
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
    try { rec.start(); } catch { setIsListening(false); return; }
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

function DashboardShell({ user, onLogout, t, lang, switchLang, apiFetch: apiFetchProp }) {
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
        apiFetchProp("/api/dashboard"),
        apiFetchProp("/api/facilities"),
        apiFetchProp("/api/vehicles"),
        apiFetchProp("/api/drivers"),
        apiFetchProp("/api/objectives"),
        apiFetchProp("/api/routes"),
        apiFetchProp("/api/scenarios"),
        apiFetchProp("/api/recommendations"),
        apiFetchProp("/api/metrics/sdg"),
        apiFetchProp("/api/events/news?relevant_only=true"),
        apiFetchProp("/api/forecast/risk?hours=12").catch(() => []),
        apiFetchProp("/api/inventory/forecasts").catch(() => []),
        apiFetchProp("/api/inventory/proactive-dispatches").catch(() => []),
        apiFetchProp("/api/metrics/ai-activity").catch(() => null),
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
  }, [apiFetchProp]);

  useEffect(() => {
    refreshAll(true);
    const id = setInterval(() => refreshAll(false), 15000);
    return () => clearInterval(id);
  }, [refreshAll]);

  useEffect(() => {
    if (voice.transcript) {
      const text = voice.transcript.toLowerCase();
      const matched = voiceConfig?.incident_types?.find((t) => text.includes(t.label.toLowerCase()) || text.includes(t.key.toLowerCase()));
      if (matched) setVoiceIncidentType(matched.key);
    }
  }, [voice.transcript, voiceConfig]);

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
      await apiFetchProp(path, { method: "POST", body: JSON.stringify(body ?? {}) });
      if (msg) {
        setMessage(msg);
        setError("");
        setTimeout(() => setMessage(""), 3000);
      }
      await refreshAll(false);
    } catch (err) { setError(err.message); }
  }, [refreshAll, apiFetchProp]);

  const handleSetSpeed = useCallback(async (speed) => {
    const clamped = Math.max(1, Math.min(100000, speed));
    try {
      await apiFetchProp("/api/simulation/speed", { method: "PUT", body: JSON.stringify({ speed_multiplier: clamped }) });
    } catch (err) { setError(err.message); }
  }, [apiFetchProp]);

  const currentSpeed = dashboard?.simulation?.speed_multiplier ?? 120;

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
      // Toast feature disabled by request
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
        return <ScenariosView scenarios={scenarios} scenarioKey={scenarioKey} setScenarioKey={setScenarioKey} scenarioComparison={scenarioComparison} setScenarioComparison={setScenarioComparison} runAction={runAction} apiFetch={apiFetchProp} />;
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
      case "rlTraining":
        return <RLTrainingView apiFetch={apiFetchProp} />;
      case "aiExplainer":
        return <AIExplainerView apiFetch={apiFetchProp} dashboard={dashboard} vehicles={dashboard?.vehicles ?? []} recommendations={recommendations} facilities={facilities} facilityLookup={facilityLookup} />;
      case "aiComparison":
        return <ComparisonView apiFetch={apiFetchProp} metrics={metrics} />;
      default:
        return <DashboardView metrics={metrics} criticalFacilities={criticalFacilities} proactiveDispatches={proactiveDispatches} riskForecast={riskForecast} auditChain={auditChain} blockchainVerify={blockchainVerify} facilityLookup={facilityLookup} aiActivity={aiActivity} latestDecision={latestDecision} previousRoute={previousRoute} activityFeed={activityFeed} />;
    }
  };

  return (
    <div className="app-shell">
      <AIRerouteToast toasts={toasts} onDismiss={dismissToast} />
      <Sidebar active={activeView} onNavigate={setActiveView} t={t} />
      <div className="main-content">
        <header className="top-bar" lang={lang}>
          <div className="top-bar-left">
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
            <SimControls onAction={runAction} onSetSpeed={handleSetSpeed} currentSpeed={currentSpeed} t={t} />
            <button className="sim-btn" onClick={onLogout} title={t.logout} style={{padding: '8px 14px', borderRadius: '999px', marginLeft: '4px'}}>
              [→
            </button>
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
      <AIChatPanel apiFetch={apiFetchProp} />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, t, switchLang } = useLanguage();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("logisight-demo-user", JSON.stringify(userData));
    }
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      localStorage.removeItem("logisight-demo-user");
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (location.pathname === "/") {
    return <LandingView />;
  }

  if (location.pathname === "/login") {
    if (user) return <Navigate to="/dashboard" replace />;
    return <LoginView t={t} onLogin={handleLogin} lang={lang} onSwitchLang={switchLang} />;
  }

  if (location.pathname === "/dashboard") {
    if (!authReady) {
      return (
        <div className="login-view">
          <div className="login-card" style={{ textAlign: "center" }}>
            <div className="logo-mark large" style={{ margin: "0 auto 16px" }}>L</div>
            <p style={{ color: "#8b8d93" }}>Loading Logisight...</p>
          </div>
        </div>
      );
    }
    if (!user) return <Navigate to="/login" replace />;
    return (
      <DashboardShell
        user={user}
        onLogout={handleLogout}
        t={t}
        lang={lang}
        switchLang={switchLang}
        apiFetch={apiFetch}
      />
    );
  }

  return <Navigate to="/" replace />;
}
