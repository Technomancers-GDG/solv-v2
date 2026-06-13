import React from "react";
import { WORKFLOW_STEPS } from "../../utils/homepage-constants";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export default function HowItWorksSection() {
  const containerRef = useScrollReveal();

  return (
    <section className="hp-section hp-section-dark" id="how-it-works" ref={containerRef}>
      <div className="homepage-container">
        {/* Section Header */}
        <div className="hp-section-header">
          <span className="hp-section-overline">Operational Workflow</span>
          <h2 className="hp-section-title">From Data to Delivery</h2>
          <p className="hp-section-description">
            How LogiSight integrates raw supply chain data, algorithms, and 
            operational telemetry to drive optimized delivery fulfillment.
          </p>
        </div>

        {/* Steps Grid Container */}
        <div className="hp-workflow-container">
          
          {/* Horizontal animated dashed line for Desktop */}
          <svg className="hp-workflow-line-desktop" viewBox="0 0 800 2" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 0,1 L 800,1" className="hp-workflow-line-path animated" />
          </svg>

          {/* Vertical dashed line for Mobile */}
          <div className="hp-workflow-line-mobile" aria-hidden="true" />

          {/* Workflow Steps */}
          {WORKFLOW_STEPS.map((step, idx) => (
            <div 
              key={step.number} 
              className="hp-workflow-step reveal-fade-up"
              data-reveal-delay={idx}
            >
              {/* Circular Step Indicator */}
              <div className="hp-step-number">
                {step.number}
              </div>

              {/* Step Information */}
              <div className="hp-step-content">
                <h3 className="hp-step-title">{step.title}</h3>
                <p className="hp-step-description">{step.description}</p>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
