import { useEffect, useRef, useState } from "react";
import "./AIDecisionWidgets.css";

function emptyText(value, fallback = "-") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

/* ------------------------------------------------------------------ */
/* AIDecisionPanel — shows the latest AI decision with storytelling    */
/* ------------------------------------------------------------------ */
export function AIDecisionPanel({ decision, confidence }) {
  const safeDecision = decision ?? {
    title: "Monitoring active logistics routes",
    reason: "Awaiting next optimization opportunity.",
    impact: ["No route changes currently required"],
    confidence: 92,
  };
  const impactItems = Array.isArray(safeDecision.impact) ? safeDecision.impact : [safeDecision.impact];
  const resolvedConfidence = Math.round(confidence ?? safeDecision.confidence ?? 0);

  // Flash animation when decision changes
  const [isNew, setIsNew] = useState(false);
  const prevIdRef = useRef(null);
  useEffect(() => {
    const id = safeDecision.id ?? safeDecision.title;
    if (prevIdRef.current && prevIdRef.current !== id) {
      setIsNew(true);
      const t = setTimeout(() => setIsNew(false), 2000);
      return () => clearTimeout(t);
    }
    prevIdRef.current = id;
  }, [safeDecision.id, safeDecision.title]);

  // Windows 11 Fluent System Status Colors
  const confidenceColor =
    resolvedConfidence >= 85 ? "#0F7B0F" : resolvedConfidence >= 65 ? "#9D5D00" : "#C42B1C";
  const confidenceBg =
    resolvedConfidence >= 85 ? "#DFF6DD" : resolvedConfidence >= 65 ? "#FFF4CE" : "#FDE7E9";
  const confidenceBorder =
    resolvedConfidence >= 85 ? "#B2DFB0" : resolvedConfidence >= 65 ? "#FDE68A" : "#F8C1C6";

  return (
    <article className={`decision-explanation-panel ${isNew ? "decision-flash" : ""}`} aria-label="Latest Recommendation">
      <header className="decision-panel-topline">
        <span className="decision-kicker">
          Latest Recommendation
        </span>
        <span
          className="ai-confidence-badge"
          style={{
            background: confidenceBg,
            color: confidenceColor,
            borderColor: confidenceBorder,
          }}
        >
          Confidence Score: {resolvedConfidence}%
        </span>
      </header>

      <div className="decision-title" aria-live="polite">→ {emptyText(safeDecision.title)}</div>

      <section className="decision-section">
        <h4 className="sr-only">Reason</h4>
        <span>Reason</span>
        <p>{emptyText(safeDecision.reason)}</p>
      </section>

      <section className="decision-section">
        <h4 className="sr-only">Business Impact</h4>
        <span>Business Impact</span>
        <ul className="impact-list-styled" aria-label="Impact details">
          {impactItems.map((item, index) => (
            <li key={`${item}-${index}`}>
              <span className="impact-checkmark" aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* RouteComparisonBlock — before vs after comparison panel             */
/* ------------------------------------------------------------------ */
export function RouteComparisonBlock({ comparison, previousRoute }) {
  const before = comparison?.before ?? previousRoute;
  const after = comparison?.after;
  if (!before || !after) return null;

  return (
    <article className="route-comparison-block" aria-label="Route Comparison">
      <header className="route-compare-header">
        <span className="route-compare-eyebrow">Route Comparison</span>
      </header>
      <div className="route-compare-cards-row">
        <section className="route-compare-card before" aria-label="Original Plan">
          <span className="compare-label">Original Plan</span>
          <strong>{before.label}</strong>
          <div className="compare-metrics">
            <span className="compare-cost">{before.cost}</span>
            <span className="compare-sep">·</span>
            <span className="compare-time">{before.time}</span>
          </div>
        </section>

        <div className="route-compare-arrow" aria-hidden="true">
          <span>→</span>
          <span className="compare-arrow-label">AI Chose</span>
        </div>

        <section className="route-compare-card after" aria-label="After AI Recommendation">
          <span className="compare-label">After</span>
          <strong>{after.label}</strong>
          <div className="compare-metrics">
            <span className="compare-cost">{after.cost}</span>
            <span className="compare-sep">·</span>
            <span className="compare-time">{after.time}</span>
          </div>
          <span className="compare-badge-improved">Optimized</span>
        </section>
      </div>

      {comparison?.decision && (
        <section className="route-compare-decision" style={{ marginTop: '16px' }}>
          <span className="compare-label">Decision Rationale</span>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--win-text-primary)' }}>{comparison.decision}</p>
        </section>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* AIActivityFeed — live scrollable event feed                         */
/* ------------------------------------------------------------------ */
export function AIActivityFeed({ events = [] }) {
  const containerRef = useRef(null);
  const prevLengthRef = useRef(events.length);

  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (events.length > prevLengthRef.current && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevLengthRef.current = events.length;
  }, [events.length]);

  const visibleEvents = events.slice(0, 20);

  if (!visibleEvents.length) {
    return (
      <div className="ai-feed-empty" role="status" style={{ color: 'var(--win-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="ai-feed-empty-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </span>
        <span>No actions recorded yet.</span>
      </div>
    );
  }

  return (
    <ul className="ai-activity-feed" aria-label="Recent AI actions" ref={containerRef} role="log" aria-live="polite">
      {visibleEvents.map((event, idx) => {
        const isRecent = idx === 0;
        return (
          <li className={`ai-feed-item ${isRecent ? "ai-feed-item-recent" : ""}`} key={event.id}>
            <time className="ai-feed-time">{event.time}</time>
            <div className="ai-feed-content">
              <strong>{event.title}</strong>
              {event.detail && <p>{event.detail}</p>}
            </div>
            {isRecent && <span className="ai-feed-new-badge" aria-label="New event">New</span>}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* AIRerouteToast — popup notification for reroute events              */
/* ------------------------------------------------------------------ */
export function AIRerouteToast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`ai-toast ai-toast-${toast.type ?? "reroute"}`}
          role="alert"
        >
          <div className="toast-icon">
            {toast.type === "warning" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
            )}
          </div>
          <div className="toast-body">
            <strong>{toast.title}</strong>
            {toast.detail && <p>{toast.detail}</p>}
          </div>
          <button
            className="toast-dismiss"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}