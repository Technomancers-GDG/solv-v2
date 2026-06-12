/**
 * ObjectivesView — Delivery objective lane cards.
 */
export function ObjectivesView({ objectives, facilityLookup }) {
  return (
    <section className="view-objectives" aria-label="Delivery Objectives">
      <ul className="lane-stack" aria-label="Objective list">
        {objectives.map((o) => (
          <li className="lane-card" key={o.id}>
            <header className="lane-head">
              <h3>{o.name}</h3>
              <span className="priority" aria-label={`Priority ${o.priority}`}>P{o.priority}</span>
            </header>
            <p>{facilityLookup[o.origin_facility_id]?.city} → {facilityLookup[o.destination_facility_id]?.city}</p>
            <dl className="lane-meta">
              <div><dd>{o.commodity}</dd></div>
              <div><dd>{o.dispatch_interval_minutes} min cadence</dd></div>
              <div><dd>{o.assigned_vehicle_ids?.length ?? 0} vehicles</dd></div>
              <div><dd>{o.fallback_facility_ids?.length ?? 0} fallbacks</dd></div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
