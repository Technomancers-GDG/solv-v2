import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 64; // Navbar height
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
    <footer className="hp-footer">
      <div className="homepage-container">
        
        {/* Footer Grid */}
        <div className="hp-footer-grid">
          
          {/* Brand Info */}
          <div className="hp-footer-brand">
            <div className="hp-footer-logo">
              <span className="hp-footer-logo-text">SOLV</span>
              <span className="hp-footer-tagline">LogiSight Platform</span>
            </div>
            <p className="hp-footer-tagline" style={{ maxWidth: "240px", marginTop: "8px" }}>
              Intelligent supply chain planning and logistics optimization.
            </p>
          </div>

          {/* Column 1: Platform */}
          <div className="hp-footer-column">
            <h4 className="hp-footer-column-title">Platform</h4>
            <div className="hp-footer-links">
              <Link to="/dashboard" className="hp-footer-link">Operations Dashboard</Link>
              <span className="hp-footer-link" onClick={() => handleScrollTo("features")}>Features</span>
              <Link to="/login" className="hp-footer-link">Sign In</Link>
            </div>
          </div>

          {/* Column 2: Resources */}
          <div className="hp-footer-column">
            <h4 className="hp-footer-column-title">Resources</h4>
            <div className="hp-footer-links">
              <a href="/docs" className="hp-footer-link" target="_blank" rel="noopener noreferrer">API Documentation</a>
              <span className="hp-footer-link" onClick={() => handleScrollTo("architecture")}>Architecture</span>
            </div>
          </div>

          {/* Column 3: Connect */}
          <div className="hp-footer-column">
            <h4 className="hp-footer-column-title">Connect</h4>
            <div className="hp-footer-links">
              <a href="https://github.com" className="hp-footer-link" target="_blank" rel="noopener noreferrer">GitHub Workspace</a>
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="hp-footer-bottom">
          <div className="hp-footer-copyright">
            &copy; 2026 LogiSight. All rights reserved.
          </div>
          <div className="hp-footer-legal-links">
            <span className="hp-footer-link" style={{ fontSize: "inherit" }}>Privacy Policy</span>
            <span className="hp-footer-link" style={{ fontSize: "inherit" }}>·</span>
            <span className="hp-footer-link" style={{ fontSize: "inherit" }}>Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
