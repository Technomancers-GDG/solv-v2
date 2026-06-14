const fs = require('fs');

const stylesPath = 'c:/Users/Haris/solv-v2/frontend/src/styles.css';
let css = fs.readFileSync(stylesPath, 'utf8');

// Strip old overrides
const oldOverrideIndex = css.indexOf('/* ========================================================');
if (oldOverrideIndex !== -1) {
  css = css.substring(0, oldOverrideIndex);
}

// 1. Root Variables
const rootRegex = /:root\s*\{[\s\S]*?\}/;
const newRoot = `:root {
  /* Elevare Dark Theme */
  --bg-gradient: radial-gradient(circle at 30% 60%, #35538c 0%, #3a3230 45%, #2a2524 100%);
  --border: rgba(255, 255, 255, 0.12);
  --text: #f9f9f9;
  --muted: #a8a3a1;
  --primary: #f9f9f9;
  --accent: #e3ad9f; /* Peach */
  --accent-hover: #d29d8f;
  --danger: #ef4444;
  --success: #10b981;
  --warning: #fcee0a;
  --blue-tag: #5574ec;
  
  --panel: rgba(58, 50, 48, 0.4);
  --panel-strong: rgba(58, 50, 48, 0.8);
  --canvas: #2a2524;
  --canvas-2: #3a3230;
  --surface: rgba(255, 255, 255, 0.03);
}`;

if (css.match(rootRegex)) {
  css = css.replace(rootRegex, newRoot);
}

css = css.replace(/body\s*\{[\s\S]*?\}/, `body {
  margin: 0;
  font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
  color: var(--text);
  background: #2a2524 var(--bg-gradient);
  background-attachment: fixed;
  min-height: 100vh;
  color-scheme: dark;
}`);

const overrides = `
/* ========================================================
   ELEVARE MOODY DARK THEME OVERRIDES
   ======================================================== */

/* Typography */
h1, h2, h3, .serif-font, .dashboard-header h1, .cmd-panel-title, .brand-title {
  font-family: 'Outfit', sans-serif !important;
  color: var(--text) !important;
  font-weight: 300 !important;
  letter-spacing: -0.03em !important;
}

.dashboard-header h1 {
  font-size: clamp(2.5rem, 4vw, 3.5rem) !important;
}

.brand-title {
  font-size: 1.4rem !important;
  font-weight: 500 !important;
}

.metric-glance-value, .item-value, .metric-value, .risk-percent, .progress-label {
  font-family: 'Outfit', sans-serif !important;
  color: var(--text) !important;
  font-weight: 400 !important;
  text-shadow: none !important;
}

/* Cards & Panels: Translucent Dark Brown */
.cmd-panel, .panel, .metric-card, .lane-card, .event-card, .util-card, .risk-card, .map-container {
  background: var(--surface) !important;
  border: 1px solid var(--border) !important;
  border-radius: 12px !important;
  box-shadow: none !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
}

/* Header & Sidebar */
.app-header, .unified-app-header {
  background: transparent !important;
  border-bottom: 1px solid var(--border) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  margin: 0 0 40px 0 !important;
  width: 100% !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
}
.header-top-row {
  border-bottom: 1px solid var(--border) !important;
}

.sidebar {
  background: rgba(42, 37, 36, 0.6) !important;
  border-right: 1px solid var(--border) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}
.sidebar button.nav-item {
  background: transparent !important;
  color: var(--muted) !important;
  border: none !important;
  font-family: 'Outfit', sans-serif !important;
  font-weight: 300 !important;
}
.sidebar button.nav-item:hover, .sidebar button.nav-item.active {
  background: rgba(255, 255, 255, 0.05) !important;
  color: var(--text) !important;
}

/* Buttons */
button {
  background: transparent !important;
  color: var(--text) !important;
  border: 1px solid var(--border) !important;
  border-radius: 2px !important; /* Sharp corners like the image */
  font-family: 'Outfit', sans-serif !important;
  font-weight: 400 !important;
}
button:hover {
  background: rgba(255, 255, 255, 0.05) !important;
}

/* The Peach Primary Button */
button.primary-btn, .btn-action.primary, .priority {
  background: var(--accent) !important;
  color: #2a2524 !important;
  border: none !important;
  font-weight: 500 !important;
}
button.primary-btn:hover, .btn-action.primary:hover {
  background: var(--accent-hover) !important;
}

/* Vivid Accents (Blue Tags like "Villa") */
.badge-prototype, .status-indicator, .status-pill, .tag, .metric-glance-context {
  background: var(--blue-tag) !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 2px !important;
  padding: 4px 10px !important;
  font-family: 'Outfit', sans-serif !important;
  font-weight: 400 !important;
  letter-spacing: 0.02em !important;
}

/* Forms & Tables */
input, select, textarea {
  background: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid var(--border) !important;
  border-radius: 2px !important;
  color: var(--text) !important;
}
input:focus, select:focus, textarea:focus {
  outline: 1px solid rgba(255, 255, 255, 0.4) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
}

.cmd-list-item {
  background: rgba(0, 0, 0, 0.1) !important;
  border: 1px solid var(--border) !important;
  border-radius: 8px !important;
}
.cmd-list-item:hover {
  background: rgba(255, 255, 255, 0.03) !important;
}

/* Remove Text Glows */
.glow-green, .glow-blue, .glow-amber, .glow-coral, .glow-teal, .glow-neutral {
  text-shadow: none !important;
  -webkit-text-fill-color: initial !important;
}

/* Link fixes */
a, .sidebar a {
  color: var(--text) !important;
}

/* Logo mark should pop */
.logo-mark {
  background: var(--accent) !important;
  color: #2a2524 !important;
}

/* Make text inside metric context darker if background is blue, but blue-tag forces white */
.metric-glance-context {
  background: var(--blue-tag) !important;
  color: #ffffff !important;
}
`;

fs.writeFileSync(stylesPath, css.trim() + '\n\n' + overrides);
console.log('Elevare Theme Applied.');
