import { useLanguage, AVAILABLE_LANGUAGES } from "../../hooks/useLanguage";
import "./LanguageSwitcher.css";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher">
      {AVAILABLE_LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          className={`language-btn ${language === lang.code ? "active" : ""}`}
          onClick={() => setLanguage(lang.code)}
          title={lang.name}
          aria-label={`Switch to ${lang.name}`}
        >
          <span className="lang-code">{lang.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
