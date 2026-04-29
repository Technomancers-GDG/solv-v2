function emptyText(value, fallback = "-") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

export function AIDecisionPanel({ decision, confidence }) {
  const safeDecision = decision ?? {
    title: "Monitoring active logistics routes",
    reason: "Waiting for the next AI route decision.",
    impact: ["No route change recommended yet"],
  };
  const impactItems = Array.isArray(safeDecision.impact) ? safeDecision.impact : [safeDecision.impact];

  return (
    <div className="decision-explanation-panel">
      <div className="decision-panel-topline">
        <span className="decision-kicker">Latest AI Decision</span>
        <span className="ai-confidence-badge">AI Confidence: {Math.round(confidence ?? safeDecision.confidence ?? 0)}%</span>
      </div>
      <div className="decision-title">→ {emptyText(safeDecision.title)}</div>
      <div className="decision-section">
        <span>Reason</span>
        <p>{emptyText(safeDecision.reason)}</p>
      </div>
      <div className="decision-section">
        <span>Impact</span>
        <ul>
          {impactItems.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function RouteComparisonBlock({ comparison, previousRoute }) {
  const before = comparison?.before ?? previousRoute;
  const after = comparison?.after;
  if (!before || !after) return null;
  return (
    <div className="route-comparison-block">
      <div className="route-compare-card before">
        <span className="compare-label">Before</span>
        <strong>{before.label}</strong>
        <p>Cost {before.cost} | Time {before.time}</p>
      </div>
      <div className="route-compare-card after">
        <span className="compare-label">After</span>
        <strong>{after.label}</strong>
        <p>Cost {after.cost} | Time {after.time}</p>
      </div>
      <div className="route-compare-decision">
        <span className="compare-label">Decision</span>
        <p>{comparison.decision}</p>
      </div>
    </div>
  );
}

export function AIActivityFeed({ events = [] }) {
  const visibleEvents = events.slice(0, 20);
  if (!visibleEvents.length) {
    return <div className="empty">No AI actions recorded yet.</div>;
  }
  return (
    <div className="ai-activity-feed" aria-label="Recent AI actions">
      {visibleEvents.map((event) => (
        <div className="ai-feed-item" key={event.id}>
          <span className="ai-feed-time">{event.time}</span>
          <div>
            <strong>{event.title}</strong>
            {event.detail && <p>{event.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
