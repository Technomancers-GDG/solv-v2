import React from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export default function FinalCTASection() {
  const containerRef = useScrollReveal();

  return (
    <section className="hp-cta-section" ref={containerRef}>
      <div className="hp-cta-container reveal-scale">
        <h2 className="hp-cta-title">Ready to Transform Your Logistics Operations?</h2>
        <p className="hp-cta-subtitle">
          Start with full visibility. Scale to intelligent automation. 
          LogiSight is ready when you are.
        </p>
        <div className="hp-cta-actions">
          <Link to="/dashboard" className="hp-btn hp-btn-primary">
            Launch Dashboard
          </Link>
          <a href="/docs" className="hp-btn hp-btn-ghost" target="_blank" rel="noopener noreferrer">
            View API Documentation
          </a>
        </div>
      </div>
    </section>
  );
}
