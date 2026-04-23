import { Panel } from "../common/UiPrimitives";

export function EventsView({ importEvents, recommendations, vehicles, decisions, driverLookup }) {
  return (
    <section className="grid-two">
      <Panel title="Import & Recommendations">
        <div className="action-row">
          <button onClick={() => importEvents(false)}>Import Event Replay</button>
          <button onClick={() => importEvents(true)}>Full News Import</button>
        </div>
        <div className="lane-stack">
          {recommendations.map((recommendation) => (
            <div className="lane-card" key={recommendation.id}>
              <div className="lane-head">
                <h3>{recommendation.action.replaceAll("_", " ")}</h3>
                <span className="priority">{recommendation.status}</span>
              </div>
              <p>{recommendation.explanation}</p>
              <div className="lane-meta">
                <span>Vehicle {vehicles.find((vehicle) => vehicle.id === recommendation.vehicle_id)?.identifier}</span>
                <span>Baseline {recommendation.baseline_cost.toFixed(1)}</span>
                <span>Recommended {recommendation.recommended_cost.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Driver Overrides">
        <div className="lane-stack">
          {decisions.map((decision) => (
            <div className="event-card" key={decision.id}>
              <div className="event-top">
                <strong>{vehicles.find((vehicle) => vehicle.id === decision.vehicle_id)?.identifier}</strong>
                <span>{decision.decision}</span>
              </div>
              <p>{decision.note}</p>
              <small>
                Driver {driverLookup[decision.driver_profile_id]?.name} • delta {decision.rating_delta.toFixed(2)}
              </small>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}
