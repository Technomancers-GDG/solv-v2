import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function NavigationBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      // Offset scroll to account for the sticky navbar height (64px)
      const offset = 64;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <nav className={`hp-navbar ${scrolled ? "nav-scrolled" : ""}`}>
      <div className="hp-nav-container">
        {/* Brand Lockup */}
        <Link to="/" className="hp-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="hp-logo-mark">SOLV</span>
          <span className="hp-brand-separator">|</span>
          <span className="hp-brand-text">LogiSight</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hp-nav-links">
          <span className="hp-nav-link" onClick={() => handleLinkClick("capabilities")}>Platform</span>
          <span className="hp-nav-link" onClick={() => handleLinkClick("features")}>Features</span>
          <span className="hp-nav-link" onClick={() => handleLinkClick("how-it-works")}>How It Works</span>
          <span className="hp-nav-link" onClick={() => handleLinkClick("architecture")}>Architecture</span>
        </div>

        {/* Desktop CTA Actions */}
        <div className="hp-nav-actions">
          <Link to="/login" className="hp-btn hp-btn-ghost">Sign In</Link>
          <Link to="/dashboard" className="hp-btn hp-btn-primary">Open Dashboard</Link>
        </div>

        {/* Hamburger Toggle (Mobile) */}
        <button 
          className={`hp-menu-toggle ${mobileMenuOpen ? "open" : ""}`} 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      <div className={`hp-mobile-menu ${mobileMenuOpen ? "open" : ""}`}>
        <span className="hp-nav-link" onClick={() => handleLinkClick("capabilities")}>Platform</span>
        <span className="hp-nav-link" onClick={() => handleLinkClick("features")}>Features</span>
        <span className="hp-nav-link" onClick={() => handleLinkClick("how-it-works")}>How It Works</span>
        <span className="hp-nav-link" onClick={() => handleLinkClick("architecture")}>Architecture</span>
        <div className="hp-nav-actions">
          <Link to="/login" className="hp-btn hp-btn-ghost" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
          <Link to="/dashboard" className="hp-btn hp-btn-primary" onClick={() => setMobileMenuOpen(false)}>Open Dashboard</Link>
        </div>
      </div>
    </nav>
  );
}
