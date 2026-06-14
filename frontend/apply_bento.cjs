const fs = require('fs');

const stylesPath = 'c:/Users/Haris/solv-v2/frontend/src/styles.css';
let css = fs.readFileSync(stylesPath, 'utf8');

// Strip old overrides
const oldOverrideIndex1 = css.indexOf('/* ========================================================');
if (oldOverrideIndex1 !== -1) {
  css = css.substring(0, oldOverrideIndex1);
}

const rootRegex = /:root\s*\{[\s\S]*?\}/;
const newRoot = `:root {
  /* Bento UI Theme */
  --bg-gradient: #b5c1b4; 
  --app-bg: #f4f5f4; 
  --border: transparent;
  --text: #111111;
  --muted: #666666;
  --primary: #1a1c1d; 
  --accent: #e5f778; 
  --accent-hover: #d4e858;
  --danger: #ff4b4b;
  --success: #10b981;
  
  --panel: #e5e8e5; 
  --panel-strong: #1a1c1d; 
  --canvas: #f4f5f4;
  --surface: #ffffff;
}`;

if (css.match(rootRegex)) {
  css = css.replace(rootRegex, newRoot);
}

css = css.replace(/body\s*\{[\s\S]*?\}/, `body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
  color: var(--text);
  background: var(--bg-gradient);
  min-height: 100vh;
  color-scheme: light;
  display: flex;
  justify-content: center;
  align-items: center;
}`);

const overrides = `
/* ========================================================
   BENTO UI THEME OVERRIDES
   ======================================================== */

/* App Shell Wrapper */
.app-shell {
  background: var(--app-bg) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  margin: 0 !important;
  display: flex;
  overflow: hidden;
}

.main-content {
  padding: 32px 40px !important;
  border-radius: 40px;
  overflow-y: auto !important;
  flex: 1;
}

/* Sidebar (Black Pill) */
.sidebar {
  background: var(--primary) !important;
  border-radius: 40px !important;
  margin: 16px 0 16px 16px !important;
  height: calc(100% - 32px) !important;
  border: none !important;
  color: #ffffff !important;
  padding: 24px 0 !important;
  flex-shrink: 0;
  overflow-x: hidden !important; 
  overflow-y: auto !important;
  display: flex !important;
  flex-direction: column !important;
  transition: width 0.3s ease !important;
  width: 260px !important;
}

.sidebar.collapsed {
  width: 80px !important;
}

/* Hide scrollbar completely but allow scroll if needed */
.sidebar::-webkit-scrollbar {
  display: none !important;
}

/* Make logo a clean, bold white circle */
.logo-mark {
  background: #ffffff !important;
  color: #1a1c1d !important;
  border: none !important;
  border-radius: 50% !important;
  width: 48px !important;
  height: 48px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-family: 'Outfit', sans-serif !important;
  font-weight: 800 !important;
  font-size: 14px !important;
  margin: 0 auto 32px auto !important;
  flex-shrink: 0;
}

/* Section Labels */
.nav-section-label {
  color: #666666 !important;
  font-family: 'Outfit', sans-serif !important;
  font-weight: 700 !important;
  font-size: 0.7rem !important;
  letter-spacing: 0.08em !important;
  padding: 16px 24px 8px 24px !important;
  text-transform: uppercase !important;
}

/* Sidebar Nav Items */
.sidebar button.nav-item {
  color: #888888 !important;
  background: transparent !important;
  border: none !important;
  border-radius: 999px !important; /* Pill */
  margin: 4px 16px !important;
  width: calc(100% - 32px) !important;
  height: 44px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  padding: 0 16px !important;
  transition: all 0.2s ease !important;
  gap: 12px !important;
  outline: none !important; /* Remove focus ring */
}

/* Hide legacy active indicators */
.sidebar button.nav-item::before, .sidebar button.nav-item::after {
  display: none !important;
}

.sidebar.collapsed button.nav-item {
  width: 48px !important;
  height: 48px !important;
  margin: 4px auto !important;
  justify-content: center !important;
  padding: 0 !important;
  border-radius: 50% !important;
}

.sidebar button.nav-item svg {
  width: 20px !important;
  height: 20px !important;
  stroke-width: 2.5px !important; 
  flex-shrink: 0;
}

.sidebar button.nav-item .nav-label {
  font-family: 'Outfit', sans-serif !important;
  font-weight: 500 !important;
  font-size: 0.95rem !important;
  white-space: nowrap !important;
}

.sidebar button.nav-item:hover, .sidebar button.nav-item.active {
  background: rgba(255,255,255,0.1) !important;
  color: #ffffff !important;
}

/* Header */
.app-header, .unified-app-header {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  margin: 0 0 32px 0 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
}
.header-top-row {
  border: none !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
}

/* Header Status Strip (White Island) */
.unified-status-strip, .header-bottom-row {
  background: #ffffff !important;
  border-radius: 999px !important;
  padding: 12px 24px !important;
  display: flex !important;
  align-items: center !important;
  gap: 24px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02) !important;
  border: none !important;
  width: 100% !important; /* Force full width to enable margin-left: auto */
}
.unified-status-strip .status-divider {
  height: 24px !important;
  width: 1px !important;
  background: var(--app-bg) !important;
}

/* Status Strip Items */
.unified-status-strip .status-item {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}
.unified-status-strip .status-label {
  color: var(--muted) !important;
  font-family: 'Outfit', sans-serif !important;
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
}
.unified-status-strip .status-value {
  color: var(--text) !important;
  font-family: 'Outfit', sans-serif !important;
  font-weight: 600 !important;
  font-size: 0.95rem !important;
}

/* Highlight Items in Status Strip */
.unified-status-strip .status-item.live-indicator {
  background: var(--app-bg) !important;
  padding: 6px 16px !important;
  border-radius: 999px !important;
}
.unified-status-strip .status-item.live-indicator .pulse-ring.active {
  background: var(--success) !important;
  border-radius: 50% !important;
  width: 8px !important;
  height: 8px !important;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2) !important;
}
.unified-status-strip .status-item.live-indicator .status-text {
  font-family: 'Outfit', sans-serif !important;
  font-weight: 700 !important;
  font-size: 0.75rem !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
}

/* Right-aligned CO2 Badge */
.unified-status-strip .status-item.highlight {
  background: var(--success) !important;
  padding: 6px 16px !important;
  border-radius: 999px !important;
  margin-left: auto !important;
}
.unified-status-strip .status-item.highlight * {
  color: #ffffff !important;
}

/* Control Buttons in Header */
.unified-sim-controls {
  display: flex !important;
  gap: 8px !important;
  background: #ffffff !important;
  padding: 6px !important;
  border-radius: 999px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02) !important;
}
.unified-sim-controls button {
  background: transparent !important;
  color: var(--text) !important;
  border-radius: 999px !important;
  box-shadow: none !important;
  padding: 6px 16px !important;
}
.unified-sim-controls button:hover {
  background: var(--app-bg) !important;
}

/* Typography */
h1, h2, h3, .serif-font, .dashboard-header h1, .brand-title {
  font-family: 'Outfit', sans-serif !important;
  color: var(--text) !important;
  font-weight: 500 !important;
  letter-spacing: -0.04em !important;
}

/* Fix for ALL CAPS panel titles */
.cmd-panel-title {
  font-family: 'Outfit', sans-serif !important;
  color: var(--text) !important;
  font-weight: 600 !important;
  letter-spacing: 0.06em !important; /* Spaced out instead of squished */
  font-size: 0.75rem !important;
  text-transform: uppercase !important;
}

.dashboard-header h1 {
  font-size: clamp(2.5rem, 4vw, 3.5rem) !important;
  font-weight: 600 !important;
}

.brand-title {
  font-size: 1.5rem !important;
  font-weight: 600 !important;
}

.metric-glance-value, .item-value, .metric-value, .risk-percent, .progress-label {
  font-family: 'Outfit', sans-serif !important;
  color: var(--text) !important;
  font-weight: 500 !important;
  letter-spacing: -0.02em !important;
}

/* Cards & Panels (Soft Bento) */
.cmd-panel, .panel, .metric-card, .lane-card, .event-card, .util-card, .risk-card, .map-container {
  background: var(--panel) !important;
  border: none !important;
  border-radius: 32px !important;
  box-shadow: none !important;
  padding: 24px !important;
  transition: transform 0.2s ease !important;
}
.cmd-panel:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 24px rgba(0,0,0,0.04) !important;
}

/* Specific Highlight Cards */
.panel-hero-1, .panel-capacity {
  background: var(--surface) !important; /* White */
}
.panel-hero-2, .panel-dispatch {
  background: var(--accent) !important; /* Neon Lime */
}

/* Black Panels */
.panel-hero-3, .panel-risk, .panel-ai-core {
  background: var(--primary) !important; /* Black */
}
.panel-hero-3 *, .panel-risk *, .panel-ai-core * {
  color: #ffffff !important; /* White text by default on black cards */
}
.panel-hero-3 .cmd-panel-title svg, .panel-risk .cmd-panel-title svg, .panel-ai-core .cmd-panel-title svg {
  color: #ffffff !important;
}

/* Fix text colors inside white inner cards */
.risk-card, .city-card, .decision-explanation-panel, .route-comparison-block, .ai-visualizer > div {
  background: #ffffff !important;
  color: #111111 !important;
  border-radius: 24px !important;
}
.panel-hero-3 .risk-card *, .panel-risk .risk-card *, .panel-risk .city-card *, .panel-ai-core .decision-explanation-panel *, .panel-ai-core .route-comparison-block * {
  color: #111111 !important; /* Force black text inside white inner cards */
}

/* Exception for confidence badges */
.ai-confidence-badge {
  color: inherit; /* Let inline styles apply */
}

/* Buttons (Pills) */
button {
  background: #ffffff !important;
  color: var(--text) !important;
  border: none !important;
  border-radius: 999px !important; /* Pill shape */
  padding: 8px 16px !important;
  font-family: 'Outfit', sans-serif !important;
  font-weight: 500 !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important;
}
button:hover {
  background: #f4f5f4 !important;
}

button.primary-btn, .btn-action.primary, .priority {
  background: var(--primary) !important;
  color: #ffffff !important;
  box-shadow: none !important;
}
button.primary-btn:hover, .btn-action.primary:hover {
  background: #333 !important;
}

/* Status Pills & Tags */
.brand-badge, .badge-prototype {
  background: #ffffff !important;
  color: #111111 !important;
  border: 1px solid rgba(0,0,0,0.08) !important;
  border-radius: 999px !important;
  padding: 6px 12px !important;
  font-weight: 700 !important;
  font-family: 'Outfit', sans-serif !important;
  font-size: 0.7rem !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02) !important;
}

.status-indicator, .status-pill, .tag, .metric-glance-context {
  background: #ffffff !important;
  color: #111111 !important;
  border: none !important;
  border-radius: 999px !important;
  padding: 6px 12px !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
}
.panel-hero-2 .metric-glance-context {
  background: #ffffff !important;
  color: var(--text) !important;
}

/* Inputs */
input, select, textarea {
  background: #ffffff !important;
  border: none !important;
  border-radius: 16px !important;
  color: var(--text) !important;
  padding: 12px 16px !important;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02) !important;
}
input:focus, select:focus, textarea:focus {
  outline: 2px solid var(--primary) !important;
}

.cmd-list-item {
  background: #ffffff !important;
  border: none !important;
  border-radius: 16px !important;
  margin-bottom: 8px !important;
}

/* Clean up text colors in black cards */
.panel-hero-3 .metric-glance-value, .panel-hero-3 .metric-glance-context,
.panel-risk .risk-city, .panel-risk .risk-percent, .panel-ai-core .telemetry-value {
  color: #ffffff !important;
}
.panel-ai-core .telemetry-label {
  color: #888888 !important; /* Muted text for labels */
}
.panel-hero-3 .metric-glance-context {
  background: rgba(255,255,255,0.1) !important;
}

/* Hide weird artifacts */
.header-bottom-row .status-strip {
  border: none !important;
}
`;

fs.writeFileSync(stylesPath, css.trim() + '\n\n' + overrides);
console.log('Bento Layout Fixed.');
