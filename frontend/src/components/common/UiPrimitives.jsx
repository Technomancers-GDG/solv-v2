/**
 * UiPrimitives — Shared design-system components.
 * Each primitive uses semantic HTML and accessibility attributes.
 */

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
  return (
    <article className={`metric-card tone-${tone}`} aria-label={`${label}: ${value}`}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      {context && <span className="metric-context">{context}</span>}
      {trend !== undefined && (
        <span className={`metric-trend ${trend > 0 ? "positive" : "negative"}`} aria-label={`Trend: ${trend > 0 ? "up" : "down"} ${Math.abs(trend).toFixed(1)}%`}>
          {trend > 0 ? "\u2191" : "\u2193"} {Math.abs(trend).toFixed(1)}%
        </span>
      )}
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
