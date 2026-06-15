import { useState, useEffect, useCallback, useMemo, useRef, startTransition, useDeferredValue, lazy, Suspense } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AIRerouteToast } from "./components/common/AIDecisionWidgets";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { AIChatPanel } from "./components/common/AIChatPanel";
import { LandingView } from "./components/landing/LandingView";

const DashboardShell = lazy(() => import("./components/DashboardShell"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));

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
      label: t.aiIntelligence,
      items: [
        { key: "rlTraining", label: t.rlTraining, icon: "🧠" },
        { key: "aiExplainer", label: t.aiExplainer, icon: "🔍" },
        { key: "aiComparison", label: t.aiComparison, icon: "📈" },
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
        <div className="logo-mark">L</div>
        {!collapsed && <span className="logo-text">Logisight</span>}
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
  const options = [120, 180, 500, 1000, 5000, 50000, 100000];
  return (
    <div className="sim-controls">
      <button className="sim-btn primary" onClick={() => onAction("/api/simulation/start", { speed_multiplier: 180 }, t.start)}>{t.start}</button>
      <button className="sim-btn" onClick={() => onAction("/api/simulation/pause", {}, t.pause)}>{t.pause}</button>
      <button className="sim-btn" onClick={() => onAction("/api/simulation/resume", {}, t.resume)}>{t.resume}</button>
      <button className="sim-btn danger" onClick={() => onAction("/api/simulation/reset", {}, t.reset)}>{t.reset}</button>
      <select className="speed-select" value={currentSpeed >= options[options.length-1] ? options[options.length-1] : currentSpeed} onChange={e => onSetSpeed(Number(e.target.value))}>
        {options.map(s => <option key={s} value={s}>{s}x</option>)}
      </select>
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

export default function App() {
  const location = useLocation();

  if (location.pathname === "/") {
    return <LandingView />;
  }

  if (location.pathname.startsWith("/client")) {
    return (
      <Suspense fallback={<div className="loading">Loading...</div>}>
        <ClientPortal />
      </Suspense>
    );
  }

  if (location.pathname === "/dashboard") {
    return <Navigate to="/client" replace />;
  }

  if (location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return <Navigate to="/" replace />;
}
