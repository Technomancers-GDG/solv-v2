import React from "react";
import { TRUST_CARDS } from "../../utils/homepage-constants";
import ArchitectureDiagram from "./ArchitectureDiagram";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const TrustIcon = ({ name }) => {
  switch (name) {
    case "server":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" strokeLinecap="round" />
          <line x1="6" y1="18" x2="6.01" y2="18" strokeLinecap="round" />
        </svg>
      );
    case "clock":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "database":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </svg>
      );
    case "shield":
      return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function TrustReliabilitySection() {
  const containerRef = useScrollReveal();

  return (
    <section className="hp-section hp-section-light" id="architecture" ref={containerRef}>
      <div className="homepage-container">
        {/* Section Header */}
        <div className="hp-section-header">
          <span className="hp-section-overline">Enterprise Reliability</span>
          <h2 className="hp-section-title">Built for Production. Proven at Scale.</h2>
          <p className="hp-section-description">
            LogiSight relies on a modern, decoupled cloud architecture designed to handle 
            massive telemetry scale and ensure uninterrupted dispatch pipelines.
          </p>
        </div>

        {/* Two Column Layout (Architecture on left, cards on right) */}
        <div className="hp-trust-layout">
          {/* Left Column - System layers */}
          <ArchitectureDiagram />

          {/* Right Column - Capability Grid */}
          <div className="hp-trust-cards">
            {TRUST_CARDS.map((card, idx) => (
              <div 
                key={card.title} 
                className="hp-trust-card reveal-fade-right"
                data-reveal-delay={idx}
              >
                <div aria-hidden="true">
                  <TrustIcon name={card.iconName} />
                </div>
                <h3 className="hp-trust-card-title">{card.title}</h3>
                <p className="hp-trust-card-metric">{card.metric}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
