const fs = require('fs');
const filePath = 'c:/Users/Haris/solv-v2/frontend/src/styles.css';
let css = fs.readFileSync(filePath, 'utf8');

// Replace the :root block completely
const rootRegex = /:root\s*\{[\s\S]*?\}/;
const newRoot = `:root {
  --bg: #d4e8fa;
  --panel: #ffffff;
  --panel-strong: #ffffff;
  --border: rgba(0, 0, 0, 1);
  --text: #000000;
  --muted: #444444;
  --primary: #000000;
  --accent: #fcee0a;
  --accent-hover: #e5d809;
  --teal: #000000;
  --coral: #000000;
  --steel: #ffffff;
  --danger: #ff4b4b;
  --success: #2ecc71;
  --shadow: 4px 4px 0px #000000;
  --shadow-hover: 6px 6px 0px #000000;

  --primary-dark: #000000;
  --primary-new: #000000;
  --primary-light: #e0e0e0;
  --success-new: #2ecc71;
  --success-light: #dcefe5;
  --warning: #fcee0a;
  --warning-light: #fffbc2;
  --error: #ff4b4b;
  --error-light: #fae0dc;
  --canvas: #d4e8fa;
  --canvas-2: #c6e0fa;
  --surface: #ffffff;
  --surface-strong: #ffffff;
  --surface-gloss: #ffffff;
}`;
css = css.replace(rootRegex, newRoot);

// Replace body background and font family
css = css.replace(/body\s*\{[\s\S]*?\}/, `body {
  margin: 0;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--text);
  background: linear-gradient(180deg, #d6eaff 0%, #fdfaf0 100%);
  background-attachment: fixed;
  min-height: 100vh;
  color-scheme: light;
}`);

// Append global structural overrides
const overrides = `
/* AETHERFIELD BRUTALIST OVERRIDES */
h1, h2, h3, h4, h5, h6, .serif-font, .panel-head h2, .cmd-panel-title, .hero h1 {
  font-family: 'Newsreader', serif;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.hero, .panel, .metric-card, .status-pill, .banner, .loading, .lane-card, .event-card, .util-card {
  border: 1.5px solid #000 !important;
  background: #ffffff !important;
  border-radius: 20px !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  color: #000 !important;
}

button {
  border: 1.5px solid #000 !important;
  border-radius: 4px !important;
  background: #000 !important;
  color: #fff !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  font-family: 'Inter', sans-serif !important;
  font-weight: 500 !important;
  padding: 0.6rem 1.2rem !important;
  text-transform: none !important;
}

button:hover {
  background: #333 !important;
  transform: none !important;
}

button.primary-btn, .hero-controls button:first-child, .priority {
  background: var(--accent) !important;
  color: #000 !important;
  border: 1.5px solid #000 !important;
  font-weight: 600 !important;
}

button.primary-btn:hover, .hero-controls button:first-child:hover {
  background: var(--accent-hover) !important;
  color: #000 !important;
}

.metric-card strong, .metric-glance-value {
  color: #000 !important;
  font-family: 'Inter', sans-serif !important;
  font-weight: 600 !important;
  font-size: 2.5rem !important;
}

.metric-card span, .metric-glance-context, .eyebrow {
  color: #000 !important;
  font-family: 'Inter', sans-serif !important;
  font-weight: 400 !important;
}

.metric-card.amber, .metric-card.teal, .metric-card.coral, .metric-card.steel {
  background: #fff !important;
  color: #000 !important;
}

/* Accent boxes for specific metrics or headers to look like 'Forecast' tag in design */
.status-pill, .tag, .priority {
  background: var(--accent) !important;
  color: #000 !important;
  border: 1px solid #000 !important;
  border-radius: 999px !important;
  padding: 4px 12px !important;
  font-size: 0.8rem !important;
  font-weight: 500 !important;
  display: inline-block !important;
}

/* Remove all weird glows and gradients */
.glow-neutral, .glow-positive, .glow-warning, .glow-critical {
  text-shadow: none !important;
}

input, select, textarea {
  border: 1px solid #000 !important;
  border-radius: 4px !important;
  background: #fff !important;
  color: #000 !important;
}
input:focus, select:focus, textarea:focus {
  outline: 2px solid #000 !important;
  border-bottom: 1px solid #000 !important;
}

.tab.active {
  background: #000 !important;
  color: #fff !important;
  border-color: #000 !important;
  box-shadow: none !important;
  border-radius: 4px !important;
}
.tab {
  border: 1px solid #000 !important;
  background: #fff !important;
  color: #000 !important;
  border-radius: 4px !important;
}

table th {
  border-bottom: 2px solid #000 !important;
  color: #000 !important;
  font-family: 'Inter', sans-serif !important;
}
table td {
  border-bottom: 1px solid #e0e0e0 !important;
}

/* Custom premium scrollbar matching brutalist theme */
::-webkit-scrollbar-thumb {
  background: #000 !important;
  border-radius: 0px !important;
}
::-webkit-scrollbar-track {
  background: transparent !important;
  border-left: 1px solid #000 !important;
}
`;

fs.writeFileSync(filePath, css + '\n' + overrides);
console.log('CSS updated successfully.');
