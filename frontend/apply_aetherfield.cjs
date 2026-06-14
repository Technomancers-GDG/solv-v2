const fs = require('fs');
const path = require('path');

const stylesPath = 'c:/Users/Haris/solv-v2/frontend/src/styles.css';
let css = fs.readFileSync(stylesPath, 'utf8');

// Replace Root Variables
const rootRegex = /:root\s*\{[\s\S]*?\}/;
const newRoot = `:root {
  /* Aetherfield Color Palette */
  --bg-gradient: linear-gradient(180deg, #d4eafc 0%, #fefcf3 100%);
  --panel: #ffffff;
  --panel-strong: #ffffff;
  --border: #111827;
  --text: #111827;
  --muted: #4b5563;
  --primary: #111827;
  --accent: #fcee0a; /* Signature Aetherfield yellow */
  --accent-hover: #e5d809;
  --teal: #111827;
  --coral: #111827;
  --steel: #ffffff;
  --danger: #ef4444;
  --success: #10b981;
  --shadow: none;
  --shadow-hover: none;

  --primary-dark: #000000;
  --primary-new: #111827;
  --primary-light: #f3f4f6;
  --success-new: #10b981;
  --success-light: #d1fae5;
  --warning: #fcee0a;
  --warning-light: #fef9c3;
  --error: #ef4444;
  --error-light: #fee2e2;
  
  --canvas: #d4eafc;
  --canvas-2: #c5e3fb;
  --surface: #ffffff;
  --surface-strong: #ffffff;
  --surface-gloss: #ffffff;
}`;

if (css.match(rootRegex)) {
  css = css.replace(rootRegex, newRoot);
}

// Clean up existing global body background
css = css.replace(/body\s*\{[\s\S]*?\}/, `body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--text);
  background: var(--bg-gradient);
  background-attachment: fixed;
  min-height: 100vh;
  color-scheme: light;
}`);

// Aetherfield Structural Overrides
const overrides = `
/* ========================================================
   AETHERFIELD THEME OVERRIDES
   These rules enforce the flat, high-contrast aesthetic
   ======================================================== */

/* 1. Typography */
h1, h2, h3, .serif-font, .dashboard-header h1, .cmd-panel-title {
  font-family: 'Newsreader', 'Cormorant Garamond', serif !important;
  color: var(--text) !important;
  font-weight: 500 !important;
  letter-spacing: -0.01em !important;
}

h1 { font-size: clamp(2.5rem, 4vw, 3.5rem) !important; }

/* Dashboard numbers should be Sans-Serif and clean */
.metric-glance-value, .item-value, .metric-value, .risk-percent, .progress-label {
  font-family: 'Inter', sans-serif !important;
  color: var(--text) !important;
  font-weight: 700 !important;
  text-shadow: none !important;
}

.metric-glance-context, .item-sub, .metric-label, .telemetry-label, .risk-factors, p, span {
  font-family: 'Inter', sans-serif;
}

/* 2. Flat Cards (White, Thin Black Border, No Shadow, 16px Radius) */
.cmd-panel, .panel, .metric-card, .lane-card, .event-card, .util-card, .risk-card, .map-container {
  background: #ffffff !important;
  border: 1px solid var(--border) !important;
  border-radius: 16px !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.cmd-panel:hover, .panel:hover {
  box-shadow: none !important;
  border-color: var(--border) !important;
  transform: translateY(-1px);
}

/* 3. Header & Sidebar */
.app-header {
  background: #ffffff !important;
  border-bottom: 1px solid var(--border) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
.app-header-top {
  border-bottom: 1px solid var(--border) !important;
}

/* Sidebar override (if it exists, force it to be white/clear instead of black) */
.sidebar, .nav-sidebar, aside {
  background: #ffffff !important;
  border-right: 1px solid var(--border) !important;
}
.sidebar a, .nav-sidebar a {
  color: var(--text) !important;
}

/* 4. Buttons (Black or Yellow, 4px Radius) */
button {
  background: #ffffff !important;
  color: var(--text) !important;
  border: 1px solid var(--border) !important;
  border-radius: 4px !important;
  box-shadow: none !important;
  font-family: 'Inter', sans-serif !important;
  font-weight: 500 !important;
}
button:hover {
  background: var(--neutral-100) !important;
}

button.primary-btn, .btn-action.primary, .priority {
  background: var(--primary) !important;
  color: #ffffff !important;
  border: 1px solid var(--border) !important;
}
button.primary-btn:hover, .btn-action.primary:hover {
  background: var(--muted) !important;
}

/* 5. Vivid Accents (Tags, Badges) */
.badge-prototype, .status-indicator, .status-pill, .tag {
  background: var(--accent) !important;
  color: var(--text) !important;
  border: 1px solid var(--border) !important;
  box-shadow: none !important;
  border-radius: 999px !important;
}

/* 6. Remove Glows and Gradients */
.glow-green, .glow-blue, .glow-amber, .glow-coral, .glow-teal, .glow-neutral {
  text-shadow: none !important;
  -webkit-text-fill-color: initial !important;
}

/* 7. Forms & Tables */
input, select, textarea {
  background: #ffffff !important;
  border: 1px solid var(--border) !important;
  border-radius: 4px !important;
  color: var(--text) !important;
}
input:focus, select:focus, textarea:focus {
  outline: 1px solid var(--border) !important;
  border-color: var(--border) !important;
}

.cmd-list-item {
  background: #ffffff !important;
  border: 1px solid var(--border) !important;
  border-radius: 8px !important;
}
.cmd-list-item:hover {
  background: var(--neutral-50) !important;
}

/* 8. Map UI Overrides */
.leaflet-container {
  background: var(--canvas-2) !important;
}
`;

fs.writeFileSync(stylesPath, css + '\n\n' + overrides);
console.log('Aetherfield theme successfully injected into styles.css.');
