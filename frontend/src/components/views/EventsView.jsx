import { Panel } from "../common/UiPrimitives";

/**
 * EventsView — Active events feed with impact scoring.
 */
export function EventsView({ events }) {
  return (
    <section className="view-events" aria-label="Active Events">
      <Panel title="Active Events Feed">
        <ul className="event-stack" aria-label="Events list">
          {events.slice(0, 20).map((e, i) => (
            <li className="event-card" key={i}>
              <header className="event-top">
                <strong>{e.city}</strong>
                <span className="event-category">{e.category}</span>
              </header>
              <p>{e.headline}</p>
              <small className="event-meta">
                <span className="event-type">{e.impact_type.replace(/_/g, " ")}</span>
                <span className="event-impact">Impact: {Number(e.impact_score).toFixed(2)}</span>
              </small>
            </li>
          ))}
        </ul>
      </Panel>
    </section>
  );
}
