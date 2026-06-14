const fs = require('fs');

const stylesPath = 'c:/Users/Haris/solv-v2/frontend/src/styles.css';
let css = fs.readFileSync(stylesPath, 'utf8');

// Strip old overrides
const oldOverrideIndex = css.indexOf('/* ========================================================');
if (oldOverrideIndex !== -1) {
  css = css.substring(0, oldOverrideIndex);
}
const oldBrutalistIndex = css.indexOf('/* AETHERFIELD BRUTALIST OVERRIDES */');
if (oldBrutalistIndex !== -1) {
  css = css.substring(0, oldBrutalistIndex);
}

// Ensure clean root variables for Aetherfield
const rootRegex = /:root\s*\{[\s\S]*?\}/;
const newRoot = `:root {
  --bg-gradient: linear-gradient(180deg, #d4eafc 0%, #fefcf3 100%);
  --border: #111827;
  --text: #111827;
  --muted: #4b5563;
  --primary: #111827;
  --accent: #fcee0a;
  --accent-hover: #e5d809;
  --danger: #ef4444;
  --success: #10b981;
  --warning: #fcee0a;
  
  --panel: #ffffff;
  --panel-strong: #ffffff;
  --canvas: #d4eafc;
  --canvas-2: #c5e3fb;
  --surface: #ffffff;
}`;

if (css.match(rootRegex)) {
  css = css.replace(rootRegex, newRoot);
}

css = css.replace(/body\s*\{[\s\S]*?\}/, `body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--text);
  background: var(--bg-gradient);
  background-attachment: fixed;
  min-height: 100vh;
  color-scheme: light;
}`);

const overrides = `
/* ========================================================
   AETHERFIELD THEME OVERRIDES
   ======================================================== */

h1, h2, h3, .serif-font, .dashboard-header h1, .cmd-panel-title {
  font-family: 'Newsreader', 'Cormorant Garamond', serif !important;
  color: var(--text) !important;
  font-weight: 500 !important;
  letter-spacing: -0.01em !important;
}

h1 { font-size: clamp(2.5rem, 4vw, 3.5rem) !important; }

.metric-glance-value, .item-value, .metric-value, .risk-percent, .progress-label {
  font-family: 'Inter', sans-serif !important;
  color: var(--text) !important;
  font-weight: 700 !important;
  text-shadow: none !important;
}

/* Base Buttons */
button {
  background: #ffffff;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  box-shadow: none;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}
button:hover {
  background: var(--neutral-100);
}

/* Primary / Action Buttons */
button.primary-btn, .btn-action.primary, .priority {
  background: var(--primary) !important;
  color: #ffffff !important;
  border: 1px solid var(--border) !important;
}

/* Navigation sidebar buttons - override general button rules */
.sidebar {
  background: #ffffff !important;
  border-right: 1px solid var(--border) !important;
}
.sidebar button.nav-item {
  background: transparent !important;
  color: var(--muted) !important;
  border: none !important;
  box-shadow: none !important;
}
.sidebar button.nav-item:hover, .sidebar button.nav-item.active {
  background: rgba(0, 0, 0, 0.04) !important;
  color: var(--text) !important;
}

/* Header */
.app-header, .unified-app-header {
  background: #ffffff !important;
  border-bottom: 1px solid var(--border) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  margin: 0 !important; /* remove margins so it flush to top */
  width: 100% !important;
}
.header-top-row {
  border-bottom: 1px solid var(--border) !important;
}

/* Cards & Panels */
.cmd-panel, .panel, .metric-card, .lane-card, .event-card, .util-card, .risk-card, .map-container {
  background: #ffffff !important;
  border: 1px solid var(--border) !important;
  border-radius: 16px !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Vivid Accents */
.badge-prototype, .status-indicator, .status-pill, .tag, .metric-glance-context {
  background: var(--accent) !important;
  color: var(--text) !important;
  border: 1px solid var(--border) !important;
  box-shadow: none !important;
  border-radius: 999px !important;
}

/* Remove Text Glows */
.glow-green, .glow-blue, .glow-amber, .glow-coral, .glow-teal, .glow-neutral {
  text-shadow: none !important;
  -webkit-text-fill-color: initial !important;
}

/* Forms & Inputs */
input, select, textarea {
  background: #ffffff !important;
  border: 1px solid var(--border) !important;
  border-radius: 4px !important;
  color: var(--text) !important;
}
input:focus, select:focus, textarea:focus {
  outline: 1px solid var(--border) !important;
}

.cmd-list-item {
  background: #ffffff !important;
  border: 1px solid var(--border) !important;
  border-radius: 8px !important;
  box-shadow: none !important;
}
`;

fs.writeFileSync(stylesPath, css.trim() + '\n\n' + overrides);
console.log('Fixed styles applied.');
