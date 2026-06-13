import { Panel } from "../common/UiPrimitives";
import "./EventsView.css";


/**
 * EventsView — Active events feed with impact scoring.
 */
export function EventsView({ events }) {
  return (
    <section className="dashboard-view" aria-label="Active Events">
      <section className="dashboard-panel" aria-label="Active Events Feed">
        <h2 className="dashboard-panel-title">{"Active Events Feed"}</h2>
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
      </section>
    </section>
  );
}
