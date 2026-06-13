import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function NavBar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="lp-nav">
      <div className="lp-container">
        <a href="/" className="lp-nav-logo">
          <div className="lp-nav-logo-mark">L</div>
          <span className="lp-nav-logo-text">Logisight</span>
          <span className="lp-nav-logo-tagline">Supply Chain Intelligence</span>
        </a>

        <div className={`lp-nav-links ${mobileOpen ? "open" : ""}`}>
          <button className="lp-nav-link" onClick={() => scrollTo("problem")}>Problem</button>
          <button className="lp-nav-link" onClick={() => scrollTo("how-it-works")}>How It Works</button>
          <button className="lp-nav-link" onClick={() => scrollTo("features")}>Features</button>
          <button className="lp-nav-link" onClick={() => scrollTo("trust")}>Why Logisight</button>
          <div className="lp-nav-actions-mobile">
            <button className="lp-nav-link-secondary" onClick={() => { setMobileOpen(false); navigate("/login"); }}>Sign In</button>
            <button className="lp-btn lp-btn-primary" onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}>Start Demo</button>
          </div>
        </div>

        <div className="lp-nav-actions">
          <button className="lp-nav-link-secondary" onClick={() => navigate("/login")}>Sign In</button>
          <button className="lp-btn lp-btn-primary" onClick={() => navigate("/dashboard")}>Start Demo</button>
        </div>

        <button
          className={`lp-nav-hamburger ${mobileOpen ? "open" : ""}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
