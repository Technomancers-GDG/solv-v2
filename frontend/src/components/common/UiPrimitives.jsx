export function Panel({ title, children, className = "" }) {
  return (
    <div className={`bento-card ${className}`} style={{ padding: '32px', marginBottom: '24px', justifyContent: 'flex-start' }}>
      {title && <div className="eyebrow" style={{marginBottom: "24px"}}>{title.toUpperCase()}</div>}
      <div className="panel-body">{children}</div>
    </div>
  );
}

export function MetricCard({ label, value, tone = "neutral", trend, context }) {
  return (
    <div className={`bento-card metric-card tone-${tone}`} style={{ padding: '24px', flex: '1', display: 'flex', flexDirection: 'column', border: tone === 'dark' ? 'none' : '1px solid var(--border)' }}>
      <div className="eyebrow" style={{marginBottom: "8px", color: tone === 'dark' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'}}>{label.toUpperCase()}</div>
      <div style={{ fontSize: '2rem', fontWeight: '800', color: tone === 'green' ? 'var(--accent-lime-strong)' : tone === 'dark' ? 'white' : 'var(--text-main)' }}>{value}</div>
      {context && <div className="metric-context" style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px'}}>{context}</div>}
      {trend !== undefined && <div className="metric-trend" style={{color: trend > 0 ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: '800', marginTop: '8px'}}>{trend > 0 ? "\u2191" : "\u2193"} {Math.abs(trend).toFixed(1)}%</div>}
    </div>
  );
}

export function ProgressBar({ value, compact }) {
  return (
    <div className={`progress-bar ${compact ? "compact" : ""}`} style={{ background: 'var(--bg-color)', borderRadius: '999px', height: compact ? '8px' : '12px', overflow: 'hidden' }}>
      <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: 'var(--accent-lime-strong)', height: '100%', borderRadius: '999px' }} />
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
