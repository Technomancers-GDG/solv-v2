import React from "react";
import { Link } from "react-router-dom";
import HeroVisualization from "./HeroVisualization";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export default function HeroSection() {
  const containerRef = useScrollReveal();

  const scrollToCapabilities = (e) => {
    e.preventDefault();
    const element = document.getElementById("capabilities");
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
    <header className="hp-hero" ref={containerRef}>
      <div className="homepage-container hp-hero-grid">
        {/* Left Column - Text Content & Actions */}
        <div className="hp-hero-content reveal-fade-left">
          <div className="hp-hero-overline">LogiSight · Enterprise Logistics Intelligence</div>
          <h1 className="hp-hero-title">
            Optimize Every Mile.{"\n"}
            Predict Every Disruption.{"\n"}
            Deliver Every Commitment.
          </h1>
          <p className="hp-hero-subtitle">
            LogiSight unifies route optimization, real-time visibility, predictive intelligence, 
            and automated decision-making into a single operations platform — purpose-built for 
            essential goods logistics across India's most complex supply chains.
          </p>
          <div className="hp-hero-actions">
            <Link to="/dashboard" className="hp-btn hp-btn-primary">
              Open Operations Dashboard
            </Link>
            <a href="#capabilities" className="hp-btn hp-btn-ghost" onClick={scrollToCapabilities}>
              Explore Platform &rarr;
            </a>
          </div>
        </div>

        {/* Right Column - Network Animation */}
        <div className="reveal-fade-right">
          <HeroVisualization />
        </div>
      </div>
    </header>
  );
}
