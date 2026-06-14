import { Panel } from "../common/UiPrimitives";

export function ScenariosView({ scenarios = [], scenarioKey, setScenarioKey, scenarioComparison, setScenarioComparison, runAction, apiFetch }) {
  const selected = scenarios.find((s) => s.scenario_key === scenarioKey);
  return (
    <div className="view-scenarios">
      <Panel title="Scenario Replay">
        <select value={scenarioKey} onChange={(e) => setScenarioKey(e.target.value)} className="scenario-select">
          <option value="">Select scenario...</option>
          {scenarios.map((s) => <option key={s.scenario_key} value={s.scenario_key}>{s.name}</option>)}
        </select>
        {selected && (
          <div className="scenario-detail">
            <h4>{selected.name}</h4>
            <p>{selected.description}</p>
            <div className="scenario-meta">
              <span>🏙️ {selected.event_city}</span>
              <span>⚠️ Severity: {(selected.severity ?? 0).toFixed(2)}</span>
              <span>⏱️ ETA x{(selected.eta_multiplier ?? 1).toFixed(2)}</span>
            </div>
            <div className="scenario-actions">
              <button className="scenario-trigger-btn" onClick={() => runAction(`/api/scenarios/${selected.scenario_key}/trigger`, {}, "Triggered")}>Trigger in Live Ops</button>
              <button className="scenario-compare-btn" onClick={async () => { const c = await apiFetch(`/api/scenarios/${selected.scenario_key}/compare`); setScenarioComparison(c); }}>Run A/B Comparison</button>
            </div>
          </div>
        )}
      </Panel>
      <Panel title="A/B Analysis: Baseline vs AI">
        {!scenarioComparison ? <div className="empty-comparison">Run comparison to view results.</div> : (
          <div className="comparison-result">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Baseline (No AI)</th>
                  <th>AI Optimized</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>On-Time Delivery %</td>
                  <td>{(scenarioComparison.baseline?.on_time_delivery_pct ?? 0).toFixed(1)}%</td>
                  <td className="highlight-ai green">{(scenarioComparison.ai?.on_time_delivery_pct ?? 0).toFixed(1)}%</td>
                  <td className="delta-positive">+{(scenarioComparison.improvement_summary?.on_time_delta_pct ?? 0).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>Average Delay</td>
                  <td>{(scenarioComparison.baseline?.average_delay_minutes ?? 0).toFixed(1)} min</td>
                  <td>{(scenarioComparison.ai?.average_delay_minutes ?? 0).toFixed(1)} min</td>
                  <td className="delta-positive">-{(scenarioComparison.improvement_summary?.delay_reduction_minutes ?? 0).toFixed(1)} min</td>
                </tr>
                <tr>
                  <td>Stockouts Prevented</td>
                  <td>{scenarioComparison.baseline?.stockouts_prevented ?? 0}</td>
                  <td className="highlight-ai amber">{scenarioComparison.ai?.stockouts_prevented ?? 0}</td>
                  <td className="delta-positive">+{scenarioComparison.improvement_summary?.stockout_delta ?? 0}</td>
                </tr>
                <tr>
                  <td>Overflow Events</td>
                  <td>{scenarioComparison.baseline?.overflow_events ?? 0}</td>
                  <td>{scenarioComparison.ai?.overflow_events ?? 0}</td>
                  <td className="delta-positive">-{scenarioComparison.improvement_summary?.overflow_reduction ?? 0}</td>
                </tr>
              </tbody>
            </table>

            <div className="comparison-summary">
              <div className="comparison-stat">
                <div className="comparison-stat-label">CO2 Emissions Saved</div>
                <div className="comparison-stat-value green">{(scenarioComparison.ai?.co2_saved_kg ?? 0).toFixed(1)} kg</div>
              </div>
              <div className="comparison-stat">
                <div className="comparison-stat-label">Idle Time Prevented</div>
                <div className="comparison-stat-value blue">{(scenarioComparison.ai?.idle_minutes_prevented ?? 0).toFixed(1)} min</div>
              </div>
              <div className="comparison-stat">
                <div className="comparison-stat-label">Total Reroutes</div>
                <div className="comparison-stat-value amber">{scenarioComparison.ai?.reroute_count ?? 0}</div>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
