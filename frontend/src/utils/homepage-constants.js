export const METRICS = [
  { value: "86", label: "Facilities", numericValue: 86, suffix: "" },
  { value: "60", label: "Active Vehicles", numericValue: 60, suffix: "+" },
  { value: "12", label: "Optimized Routes", numericValue: 12, suffix: "" },
  { value: "44", label: "Active Objectives", numericValue: 44, suffix: "" },
  { value: "99.7", label: "System Uptime", numericValue: 99.7, suffix: "%" }
];

export const FEATURES = [
  {
    id: "route-optimization",
    title: "Intelligent Route Optimization",
    description: "Dynamic route planning with NSGA-II multi-objective optimization. Handles time windows, vehicle capacity, driver rest requirements, and real-time road conditions.",
    detail: "18% avg. distance reduction · 44 active objectives · Multi-constraint solver",
    iconName: "route"
  },
  {
    id: "realtime-visibility",
    title: "Real-Time Visibility",
    description: "Live transport monitoring across your entire logistics network. WebSocket-powered operational awareness with sub-second updates.",
    detail: "86 facilities tracked · Live vehicle telemetry · Instant status updates",
    iconName: "radar"
  },
  {
    id: "predictive-intelligence",
    title: "Predictive Intelligence",
    description: "Reinforcement Learning decision engine with 12-hour risk forecasting. Proactive dispatch recommendations before disruptions impact operations.",
    detail: "RL-powered decisions · 12h risk forecast · Proactive pre-positioning",
    iconName: "brain"
  },
  {
    id: "supply-chain-control",
    title: "Supply Chain Control",
    description: "Centralized command center with blockchain-audited decisions. Full traceability from dispatch to delivery with tamper-evident records.",
    detail: "Blockchain audit trail · Decision traceability · Chain verification",
    iconName: "shield"
  }
];

export const WORKFLOW_STEPS = [
  {
    number: "01",
    title: "Data Collection",
    description: "Real-time ingestion from facilities, vehicles, weather systems, and news feeds across the logistics network."
  },
  {
    number: "02",
    title: "Optimization Engine",
    description: "NSGA-II multi-objective optimizer evaluates routes, constraints, and resource allocation simultaneously."
  },
  {
    number: "03",
    title: "Decision Intelligence",
    description: "RL agent selects optimal actions — reroute, pre-position inventory, adjust dispatch intervals."
  },
  {
    number: "04",
    title: "Operational Execution",
    description: "Automated dispatch, driver instructions, live tracking, and blockchain-audited delivery confirmation."
  }
];

export const CAPABILITY_TABS = [
  {
    id: "route-optimization",
    label: "Route Optimization",
    iconName: "route",
    screenshot: "/screenshots/route-optimization.webp",
    chromeTitle: "LogiSight — Live Map · Route Optimization",
    badges: ["12 Active Routes", "NSGA-II Optimizer"]
  },
  {
    id: "realtime-tracking",
    label: "Real-Time Tracking",
    iconName: "radar",
    screenshot: "/screenshots/realtime-tracking.webp",
    chromeTitle: "LogiSight — Live Map · Vehicle Tracking",
    badges: ["Sub-second Updates", "WebSocket Powered"]
  },
  {
    id: "objective-management",
    label: "Objective Management",
    iconName: "target",
    screenshot: "/screenshots/objective-management.webp",
    chromeTitle: "LogiSight — Objectives",
    badges: ["44 Active Objectives", "Priority Routing"]
  },
  {
    id: "decision-intelligence",
    label: "Decision Intelligence",
    iconName: "brain",
    screenshot: "/screenshots/decision-intelligence.webp",
    chromeTitle: "LogiSight — AI Decision Engine",
    badges: ["RL Agent Active", "Blockchain Audited"]
  },
  {
    id: "live-monitoring",
    label: "Live Monitoring",
    iconName: "pulse",
    screenshot: "/screenshots/live-monitoring.webp",
    chromeTitle: "LogiSight — Operations Dashboard",
    badges: ["Real-Time Metrics", "12h Risk Forecast"]
  }
];

export const ARCHITECTURE_LAYERS = [
  {
    name: "Presentation Layer",
    className: "presentation-layer",
    items: ["Admin Dashboard", "Driver Mobile App"]
  },
  {
    name: "Intelligence Layer",
    className: "intelligence-layer",
    items: ["RL Engine", "NSGA-II", "Risk Forecast", "Gemini AI", "Blockchain Audit"]
  },
  {
    name: "Data Layer",
    className: "data-layer",
    items: ["86 Facilities", "Real-time Events", "WebSocket Stream", "SQLAlchemy ORM"]
  }
];

export const TRUST_CARDS = [
  {
    iconName: "server",
    title: "Scalable Architecture",
    metric: "60 → 200+ vehicles with zero downtime"
  },
  {
    iconName: "clock",
    title: "Real-Time Operations",
    metric: "Sub-second WebSocket updates, 15s polling fallback"
  },
  {
    iconName: "database",
    title: "Data-Driven Decisions",
    metric: "Every AI decision blockchain-audited and traceable"
  },
  {
    iconName: "shield",
    title: "Production Ready",
    metric: "FastAPI + SQLAlchemy backend, Render/GCP deployable"
  }
];
