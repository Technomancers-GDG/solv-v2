const SPEED_OPTIONS = [120, 180, 500, 1000, 5000];

export function SettingsView({ lang, onSwitchLang, t, currentSpeed, onSetSpeed, clientContext }) {
  return (
    <div className="view-settings" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 24 }}>{t.settings}</h2>

      <div
        className="settings-card"
        style={{
          background: "var(--surface)",
          borderRadius: 12,
          padding: 24,
          border: "1px solid var(--border)",
          marginBottom: 16,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem" }}>{t.language}</h3>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
            Choose your preferred interface language.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            className={`sim-btn ${lang === "en" ? "primary" : ""}`}
            onClick={() => onSwitchLang("en")}
            aria-pressed={lang === "en"}
          >
            {t.english}
          </button>
          <button
            className={`sim-btn ${lang === "hi" ? "primary" : ""}`}
            onClick={() => onSwitchLang("hi")}
            aria-pressed={lang === "hi"}
          >
            {t.hindi}
          </button>
        </div>
      </div>

      {clientContext && (
        <div
          className="settings-card"
          style={{
            background: "var(--surface)",
            borderRadius: 12,
            padding: 24,
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem" }}>Speed</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
              Simulation processing rate
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <select
              className="speed-select"
              value={currentSpeed >= SPEED_OPTIONS[SPEED_OPTIONS.length - 1] ? SPEED_OPTIONS[SPEED_OPTIONS.length - 1] : currentSpeed}
              onChange={(e) => onSetSpeed(Number(e.target.value))}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              {SPEED_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
            <span
              style={{
                fontSize: "0.85rem",
                color: "var(--muted)",
                whiteSpace: "nowrap",
              }}
            >
              Current: {currentSpeed ?? 120}x
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
