import { Panel } from "../common/UiPrimitives";

export function SettingsView({ lang, onSwitchLang, t }) {
  return (
    <div className="view-settings" style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <div className="view-header" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>{t.settings}</h2>
        <p style={{ color: "var(--text-muted)", fontSize: '1.1rem' }}>Manage your preferences and application configuration.</p>
      </div>

      <div className="bento-row" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Panel title={t.language}>
          <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.95rem", fontWeight: "500" }}>
                Choose your preferred interface language.
              </p>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <button
                style={{
                  padding: "12px 24px",
                  borderRadius: "999px",
                  fontWeight: "800",
                  border: "none",
                  cursor: "pointer",
                  background: lang === "en" ? "var(--dark-panel)" : "var(--bg-color)",
                  color: lang === "en" ? "white" : "var(--text-muted)",
                  boxShadow: lang === "en" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.2s"
                }}
                onClick={() => onSwitchLang("en")}
                aria-pressed={lang === "en"}
              >
                {t.english}
              </button>
              <button
                style={{
                  padding: "12px 24px",
                  borderRadius: "999px",
                  fontWeight: "800",
                  border: "none",
                  cursor: "pointer",
                  background: lang === "hi" ? "var(--dark-panel)" : "var(--bg-color)",
                  color: lang === "hi" ? "white" : "var(--text-muted)",
                  boxShadow: lang === "hi" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.2s"
                }}
                onClick={() => onSwitchLang("hi")}
                aria-pressed={lang === "hi"}
              >
                {t.hindi}
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
