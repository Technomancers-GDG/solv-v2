import { Panel } from "../common/UiPrimitives";

/**
 * NetworkView — Facility and fleet network overview tables.
 */
export function NetworkView({ facilities, vehicles }) {
  return (
    <section className="view-network" aria-label="Network Overview">
      <div className="grid-two">
        {/* Facilities table */}
        <Panel title="Facilities">
          <div className="table-wrap" role="region" aria-label="Facilities table" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">City</th>
                  <th scope="col">Type</th>
                  <th scope="col">Capacity</th>
                  <th scope="col">Inventory</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((f) => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{f.city}</td>
                    <td>{f.facility_type}</td>
                    <td>{f.base_capacity_units.toLocaleString()}</td>
                    <td>{f.current_inventory_units.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Fleet table */}
        <Panel title="Fleet">
          <div className="table-wrap" role="region" aria-label="Fleet table" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Type</th>
                  <th scope="col">Payload</th>
                  <th scope="col">Speed</th>
                  <th scope="col">Emission</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>{v.identifier}</td>
                    <td>{v.vehicle_type}</td>
                    <td>{v.payload_capacity_units}</td>
                    <td>{v.average_speed_kmph}</td>
                    <td>{Number(v.emission_kg_per_km).toFixed(2)}</td>
                    <td><span className={`status-badge ${v.status.toLowerCase().replace("_", "-")}`}>{v.status.replace("_", " ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </section>
  );
}
