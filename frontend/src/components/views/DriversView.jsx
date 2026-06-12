import { useState } from "react";
import { Panel } from "../common/UiPrimitives";

function driverTone(overrideRating) {
  if (overrideRating < 0.7) {
    return "danger";
  }
  if (overrideRating <= 1.0) {
    return "warning";
  }
  return "good";
}

function decisionOutcome(decision) {
  if (decision.rating_delta > 0) {
    return "better";
  }
  if (decision.rating_delta < 0) {
    return "worse";
  }
  return "neutral";
}

export function DriversView({ drivers, vehicles, decisions, handleDriverQuickUpdate }) {
  const [expandedDriverId, setExpandedDriverId] = useState(null);

  async function onBiasChange(driver, field, nextValue) {
    await handleDriverQuickUpdate(driver.id, {
      [field]: Number(nextValue),
    });
  }

  return (
    <section className="grid-two" aria-label="Drivers Management">
      <Panel title="Driver Profiles">
        <div className="table-wrap" role="region" aria-label="Drivers table" tabIndex={0}>
          <table aria-label="List of drivers">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Override Rating</th>
                <th scope="col">Confidence</th>
                <th scope="col">Accept Bias</th>
                <th scope="col">Active</th>
                <th scope="col"># Vehicles</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const assignedVehicles = vehicles.filter(
                  (vehicle) => vehicle.driver_profile_id === driver.id,
                );
                const isExpanded = expandedDriverId === driver.id;

                return (
                  <>
                    <tr key={driver.id} onClick={() => setExpandedDriverId(isExpanded ? null : driver.id)}>
                      <td>{driver.name}</td>
                      <td>
                        <span className={`status-badge ${driverTone(driver.override_rating)}`}>
                          {driver.override_rating.toFixed(2)}
                        </span>
                      </td>
                      <td>{(driver.confidence * 100).toFixed(0)}%</td>
                      <td>{(driver.accept_recommendation_bias * 100).toFixed(0)}%</td>
                      <td>{driver.active ? "yes" : "no"}</td>
                      <td>{assignedVehicles.length}</td>
                    </tr>
                    {isExpanded ? (
                      <tr key={`${driver.id}-details`}>
                        <td colSpan={6}>
                          <div className="lane-stack">
                            <article className="lane-card">
                              <header className="lane-head">
                                <h3>Assigned Vehicles</h3>
                              </header>
                              <div className="chip-row" role="list" aria-label="Vehicles">
                                {assignedVehicles.length === 0
                                  ? <span className="empty-text">No assigned vehicles</span>
                                  : assignedVehicles.map((vehicle) => (
                                      <span key={vehicle.id} className="chip" role="listitem">
                                        {vehicle.identifier}
                                      </span>
                                    ))}
                              </div>
                            </article>

                            <article className="lane-card">
                              <header className="lane-head">
                                <h3>Recent Decisions</h3>
                              </header>
                              <ul className="lane-stack" aria-label="Recent decisions">
                                {decisions
                                  .filter((decision) => decision.driver_profile_id === driver.id)
                                  .slice(0, 6)
                                  .map((decision) => (
                                    <li key={decision.id}>
                                      <article className="event-card">
                                        <header className="event-top">
                                          <strong>{decision.decision}</strong>
                                          <span className={`status-badge ${decisionOutcome(decision) === "better" ? "good" : decisionOutcome(decision) === "worse" ? "danger" : "warning"}`}>
                                            {decisionOutcome(decision)}
                                          </span>
                                        </header>
                                        <small>
                                          rating delta {decision.rating_delta.toFixed(2)}
                                        </small>
                                        <p>{decision.note || "No note provided"}</p>
                                      </article>
                                    </li>
                                  ))}
                              </ul>
                            </article>

                            <article className="lane-card">
                              <header className="lane-head">
                                <h3>Bias Tuning</h3>
                              </header>
                              <label className="field">
                                <span>Override Rating: {driver.override_rating.toFixed(2)}</span>
                                <input
                                  type="range"
                                  min="0.4"
                                  max="1.5"
                                  step="0.01"
                                  value={driver.override_rating}
                                  onChange={(event) => onBiasChange(driver, "override_rating", event.target.value)}
                                />
                              </label>
                              <label className="field">
                                <span>Confidence: {driver.confidence.toFixed(2)}</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={driver.confidence}
                                  onChange={(event) => onBiasChange(driver, "confidence", event.target.value)}
                                />
                              </label>
                              <label className="field">
                                <span>
                                  Accept Recommendation Bias: {driver.accept_recommendation_bias.toFixed(2)}
                                </span>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={driver.accept_recommendation_bias}
                                  onChange={(event) =>
                                    onBiasChange(driver, "accept_recommendation_bias", event.target.value)
                                  }
                                />
                              </label>
                            </article>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Driver Insights">
        <ul className="lane-stack" aria-label="Driver insights">
          {drivers.map((driver) => {
            const driverDecisions = decisions.filter(
              (decision) => decision.driver_profile_id === driver.id,
            );
            const accepted = driverDecisions.filter((decision) => decision.decision === "accepted").length;
            const ignored = driverDecisions.filter((decision) => decision.decision === "ignored").length;

            return (
              <li key={driver.id}>
                <article className="lane-card">
                  <header className="lane-head">
                    <h3>{driver.name}</h3>
                    <span className={`status-badge ${driverTone(driver.override_rating)}`}>
                      {driver.override_rating.toFixed(2)}
                    </span>
                  </header>
                  <dl className="lane-meta">
                    <div className="info-item"><dt>Decisions:</dt><dd>{driverDecisions.length}</dd></div>
                    <div className="info-item"><dt>Accepted:</dt><dd>{accepted}</dd></div>
                    <div className="info-item"><dt>Ignored:</dt><dd>{ignored}</dd></div>
                  </dl>
                </article>
              </li>
            );
          })}
        </ul>
      </Panel>
    </section>
  );
}
