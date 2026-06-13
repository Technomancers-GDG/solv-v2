import "./SettingsView.css";
/**
 * SettingsView — User preferences (language selection).
 */
export function SettingsView({ lang, onSwitchLang, t }) {
  return (
    <section className="dashboard-view" aria-label="Settings">
      <h2>{t.settings}</h2>

      <article className="settings-card" aria-label="Language preferences">
        <header className="settings-card-header">
          <h3>{t.language}</h3>
          <p>Choose your preferred interface language.</p>
        </header>

        <div className="settings-lang-options" role="radiogroup" aria-label="Language options">
          <button
            className={`sim-btn ${lang === "en" ? "primary" : ""}`}
            onClick={() => onSwitchLang("en")}
            aria-pressed={lang === "en"}
            role="radio"
            aria-checked={lang === "en"}
          >
            {t.english}
          </button>
          <button
            className={`sim-btn ${lang === "hi" ? "primary" : ""}`}
            onClick={() => onSwitchLang("hi")}
            aria-pressed={lang === "hi"}
            role="radio"
            aria-checked={lang === "hi"}
          >
            {t.hindi}
          </button>
        </div>
      </article>
    </section>
  );
}
