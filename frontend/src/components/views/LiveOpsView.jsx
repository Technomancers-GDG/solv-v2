import { Panel, MetricCard as StatsCard, ProgressBar } from "../common/UiPrimitives";
import "./LiveOpsView.css";


/**
 * LiveOpsView — Real-time operational monitoring.
 * Windows 11 Fluent Design System.
 */
export function LiveOpsView({ metrics, deferredVehicles, objectiveLookup }) {
  return (
    <section className="dashboard-view" aria-label="Live Operations">
      {/* Operational KPIs */}
      <div className="ops-metrics" role="list" aria-label="Operational metrics">
        <StatsCard label="Active Trucks" value={metrics?.active_trucks ?? 0} tone="blue" />
        <StatsCard label="Queued" value={metrics?.queued_trucks ?? 0} tone="amber" />
        <StatsCard label="Reroutes" value={metrics?.reroute_count ?? 0} tone="coral" />
        <StatsCard label="Idle Prevented" value={`${(metrics?.idle_minutes_prevented ?? 0).toFixed(0)} min`} tone="green" />
      </div>

      {/* Vehicle progress table */}
      <Panel title="VEHICLE PROGRESS" className="live-ops-panel">
        <div className="table-wrap" role="region" aria-label="Vehicle progress table" tabIndex={0}>
          <table className="fluent-table">
            <thead>
              <tr>
                <th scope="col">VEHICLE ID</th>
                <th scope="col">STATUS</th>
                <th scope="col">OBJECTIVE</th>
                <th scope="col">PROGRESS</th>
                <th scope="col">PAYLOAD</th>
                <th scope="col">ETA</th>
                <th scope="col">AI ACTION</th>
              </tr>
            </thead>
            <tbody>
              {deferredVehicles.slice(0, 30).map((v) => {
                const action = v.recommendation_action ? v.recommendation_action.replace("_", " ") : "Continue";
                const actionClass = action.toLowerCase().includes("reroute") ? "reroute" : action.toLowerCase().includes("hold") ? "hold" : "continue";
                
                return (
                  <tr key={v.vehicle_id}>
                    <td className="cell-id"><strong>{v.identifier}</strong></td>
                    <td><span className={`status-badge ${v.status.toLowerCase().replace("_", "-")}`}>{v.status.replace("_", " ").toUpperCase()}</span></td>
                    <td className="cell-objective" title={objectiveLookup[v.objective_id]?.name ?? "—"}>{objectiveLookup[v.objective_id]?.name ?? "—"}</td>
                    <td className="cell-progress"><ProgressBar value={v.progress_pct} compact /></td>
                    <td className="cell-payload">{v.payload_units} units</td>
                    <td className="cell-eta">{v.eta ? v.eta.slice(11, 16) : "—"}</td>
                    <td><span className={`ai-action-pill ${actionClass}`}>{action}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}
