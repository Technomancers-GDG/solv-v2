import React from "react";
import { FEATURES } from "../../utils/homepage-constants";
import FeatureCard from "./FeatureCard";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export default function CoreFeaturesSection() {
  const containerRef = useScrollReveal();

  return (
    <section className="hp-section hp-section-light" id="features" ref={containerRef}>
      <div className="homepage-container">
        {/* Section Header */}
        <div className="hp-section-header">
          <span className="hp-section-overline">Core Capabilities</span>
          <h2 className="hp-section-title">Built for Enterprise Logistics Operations</h2>
          <p className="hp-section-description">
            LogiSight integrates industrial-grade solvers and real-time operations trackers 
            to maximize efficiency, reliability, and traceabilty.
          </p>
        </div>

        {/* Features Card Grid */}
        <div className="hp-features-grid">
          {FEATURES.map((feature, idx) => (
            <FeatureCard 
              key={feature.id} 
              feature={feature} 
              index={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
