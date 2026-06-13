import { Panel, MetricCard as StatsCard, ProgressBar } from "../common/UiPrimitives";
import "./LiveOpsView.css";


/**
 * LiveOpsView — Real-time operational monitoring.
 * Displays active truck metrics and vehicle progress table.
 */
export function LiveOpsView({ metrics, deferredVehicles, objectiveLookup }) {
  return (
    <section className="dashboard-view" aria-label="Live Operations">
      {/* Operational KPIs */}
      <div className="ops-metrics" role="list" aria-label="Operational metrics">
        <StatsCard label="Active Trucks" value={metrics?.active_trucks ?? 0} tone="blue" />
        <StatsCard label="Queued" value={metrics?.queued_trucks ?? 0} tone="amber" />
        <StatsCard label="Reroutes" value={metrics?.reroute_count ?? 0} tone="purple" />
        <StatsCard label="Idle Prevented" value={`${(metrics?.idle_minutes_prevented ?? 0).toFixed(0)} min`} tone="green" />
      </div>

      {/* Vehicle progress table */}
      <section className="dashboard-panel" aria-label="Vehicle Progress">
        <h2 className="dashboard-panel-title">{"Vehicle Progress"}</h2>
        <div className="table-wrap" role="region" aria-label="Vehicle progress table" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Vehicle</th>
                <th scope="col">Status</th>
                <th scope="col">Objective</th>
                <th scope="col">Progress</th>
                <th scope="col">Payload</th>
                <th scope="col">ETA</th>
                <th scope="col">AI Action</th>
              </tr>
            </thead>
            <tbody>
              {deferredVehicles.slice(0, 30).map((v) => (
                <tr key={v.vehicle_id}>
                  <td>{v.identifier}</td>
                  <td><span className={`status-badge ${v.status.toLowerCase().replace("_", "-")}`}>{v.status.replace("_", " ")}</span></td>
                  <td>{objectiveLookup[v.objective_id]?.name ?? "—"}</td>
                  <td><ProgressBar value={v.progress_pct} compact /></td>
                  <td>{v.payload_units}</td>
                  <td>{v.eta ? v.eta.slice(0, 19).replace("T", " ") : "—"}</td>
                  <td className="ai-action-cell">{v.recommendation_action ? v.recommendation_action.replace("_", " ") : "continue"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
