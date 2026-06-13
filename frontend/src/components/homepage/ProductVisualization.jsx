import React, { useState, useEffect } from "react";
import { CAPABILITY_TABS } from "../../utils/homepage-constants";
import ProductScreenshot from "./ProductScreenshot";
import { useScrollReveal } from "../../hooks/useScrollReveal";

const TabIcon = ({ name }) => {
  switch (name) {
    case "route":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    case "radar":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    case "target":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "brain":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case "pulse":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function ProductVisualization() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useScrollReveal();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  // Handles auto rotation
  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CAPABILITY_TABS.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isPaused, prefersReducedMotion]);

  // Handles resume timer (when paused, wait 15 seconds of inactivity then resume)
  useEffect(() => {
    if (!isPaused) return;

    const resumeTimer = setTimeout(() => {
      setIsPaused(false);
    }, 15000);

    return () => clearTimeout(resumeTimer);
  }, [isPaused, activeIndex]);

  const handleTabClick = (idx) => {
    setActiveIndex(idx);
    setIsPaused(true);
  };

  return (
    <section 
      className="hp-section hp-section-dark" 
      id="capabilities" 
      ref={containerRef}
      onClick={() => setIsPaused(true)}
    >
      <div className="homepage-container reveal-scale">
        {/* Section Header */}
        <div className="hp-section-header">
          <span className="hp-section-overline">Platform Capabilities</span>
          <h2 className="hp-section-title">One Platform. Complete Operational Control.</h2>
          <p className="hp-section-description">
            From route planning to real-time decision intelligence — every capability 
            your logistics operations require.
          </p>
        </div>

        {/* Dynamic Tab Toggles */}
        <div className="hp-tabs-container" role="tablist" aria-label="Platform capabilities">
          {CAPABILITY_TABS.map((tab, idx) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeIndex === idx}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`hp-tab-btn ${activeIndex === idx ? "active" : ""}`}
              onClick={() => handleTabClick(idx)}
            >
              <TabIcon name={tab.iconName} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tabs Screenshot Panels */}
        <div className="hp-tab-panels">
          {CAPABILITY_TABS.map((tab, idx) => (
            <div
              key={tab.id}
              id={`panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              className={`hp-screenshot-panel ${activeIndex === idx ? "active" : ""}`}
              hidden={activeIndex !== idx}
            >
              {activeIndex === idx && (
                <ProductScreenshot
                  screenshotUrl={tab.screenshot}
                  chromeTitle={tab.chromeTitle}
                  badges={tab.badges}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
