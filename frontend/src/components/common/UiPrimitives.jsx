export function Panel({ title, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function MetricCard({ label, value, tone }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ProgressBar({ value, compact = false }) {
  return (
    <div className={compact ? "progress compact" : "progress"}>
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Input({ label, value, onChange, required = true }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </label>
  );
}

export function Select({ label, value, options, onChange, required = true }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
        <option value="">Select</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
