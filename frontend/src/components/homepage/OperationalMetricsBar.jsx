import React, { useState, useEffect } from "react";
import { METRICS } from "../../utils/homepage-constants";
import { useCountUp } from "../../hooks/useCountUp";

function MetricItem({ metric, startTrigger }) {
  const count = useCountUp(metric.numericValue, 1200, startTrigger);
  
  // Format numeric output: handle floating numbers (e.g., 99.7) vs integers (e.g., 86)
  const isDecimal = metric.numericValue % 1 !== 0;
  const displayValue = isDecimal ? count.toFixed(1) : Math.floor(count);

  return (
    <div className="hp-metric-item">
      <div className="hp-metric-number" aria-label={`${metric.label}: ${metric.value}${metric.suffix}`}>
        {displayValue}{metric.suffix}
      </div>
      <div className="hp-metric-label">{metric.label}</div>
    </div>
  );
}

export default function OperationalMetricsBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [barRef, setBarRef] = useState(null);

  useEffect(() => {
    if (!barRef) return;

    // Direct intersection observer to trigger the animated numbers when the bar enters the viewport
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { 
      threshold: 0.2,
      rootMargin: "0px 0px -20px 0px"
    });

    observer.observe(barRef);
    return () => observer.disconnect();
  }, [barRef]);

  return (
    <section className="hp-metrics-bar" ref={setBarRef}>
      <div className="hp-metrics-grid">
        {METRICS.map((metric) => (
          <MetricItem 
            key={metric.label} 
            metric={metric} 
            startTrigger={isVisible} 
          />
        ))}
      </div>
    </section>
  );
}
