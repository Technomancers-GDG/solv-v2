/**
 * UiPrimitives — Shared design-system components.
 * Refactored for Windows 11 Fluent Design System.
 */
import "./UiPrimitives.css";

/** Panel — Card container with optional title. Uses <section> for landmark. */
export function Panel({ title, children, className = "" }) {
  return (
    <section className={`panel ${className}`} aria-label={title || undefined}>
      {title && (
        <header className="panel-header">
          <h3>{title}</h3>
        </header>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}

/** MetricCard — KPI display tile with semantic tone indicator. */
export function MetricCard({ label, value, tone = "neutral", trend, context }) {
  // Map tone to the exact text colors expected in the new premium design
  const glowClass = `glow-${tone}`;
  
  return (
    <article className="cmd-panel" aria-label={`${label}: ${value}`}>
      <h2 className="cmd-panel-title">
        {/* Simple generic SVG for the title if desired, or just text */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        {label}
      </h2>
      <div className="metric-glance">
        <div className={`metric-glance-value ${glowClass}`}>{value}</div>
        {context && (
          <div className="metric-glance-context">
            {trend !== undefined ? (
              <span className={`metric-trend ${trend > 0 ? "positive" : "negative"}`}>
                {trend > 0 ? "\u2191" : "\u2193"} {Math.abs(trend).toFixed(1)}%
              </span>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            )}
            {context}
          </div>
        )}
      </div>
    </article>
  );
}

/** ProgressBar — Accessible progress indicator. */
export function ProgressBar({ value, compact }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`progress-bar ${compact ? "compact" : ""}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clamped.toFixed(0)}% complete`}
    >
      <div className="progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}

/** Input — Labelled text input field. */
export function Input({ label, value, onChange, required = true, placeholder }) {
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
  );
}

/** Select — Labelled dropdown field. */
export function Select({ label, value, options, onChange, required = true }) {
  const id = `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      >
        <option value="">Select</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}