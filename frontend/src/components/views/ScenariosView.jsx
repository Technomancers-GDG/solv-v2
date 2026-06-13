import { Panel } from "../common/UiPrimitives";
import "./ScenariosView.css";


/**
 * ScenariosView — Scenario replay and baseline-vs-AI comparison.
 */
export function ScenariosView({ scenarios, scenarioKey, setScenarioKey, scenarioComparison, setScenarioComparison, runAction, apiFetch }) {
  const selected = scenarios.find((s) => s.scenario_key === scenarioKey);
  return (
    <section className="dashboard-view" aria-label="Scenario Analysis">
      <div className="grid-two">
        {/* Scenario selector */}
        <section className="dashboard-panel" aria-label="Scenario Replay">
        <h2 className="dashboard-panel-title">{"Scenario Replay"}</h2>
          <div className="field">
            <label htmlFor="scenario-select">Choose scenario</label>
            <select id="scenario-select" value={scenarioKey} onChange={(e) => setScenarioKey(e.target.value)} className="scenario-select">
              <option value="">Select scenario...</option>
              {scenarios.map((s) => <option key={s.scenario_key} value={s.scenario_key}>{s.name}</option>)}
            </select>
          </div>
          {selected && (
            <article className="scenario-detail" aria-label={`Scenario: ${selected.name}`}>
              <h4>{selected.name}</h4>
              <p>{selected.description}</p>
              <div className="scenario-meta">{selected.event_city} • severity {selected.severity.toFixed(2)} • ETA x{selected.eta_multiplier.toFixed(2)}</div>
              <div className="scenario-actions" role="group" aria-label="Scenario actions">
                <button onClick={() => runAction(`/api/scenarios/${selected.scenario_key}/trigger`, {}, "Triggered")}>Trigger</button>
                <button onClick={async () => { const c = await apiFetch(`/api/scenarios/${selected.scenario_key}/compare`); setScenarioComparison(c); }}>Compare Baseline vs AI</button>
              </div>
            </article>
          )}
        </section>

        {/* Comparison results */}
        <section className="dashboard-panel" aria-label="Baseline vs AI">
        <h2 className="dashboard-panel-title">{"Baseline vs AI"}</h2>
          {!scenarioComparison ? <p className="empty">Run comparison to view results.</p> : (
            <div className="comparison-result">
              <div className="comparison-grid" role="table" aria-label="Scenario comparison">
                <div><strong>Baseline On-Time</strong><p>{scenarioComparison.baseline.on_time_delivery_pct.toFixed(1)}%</p></div>
                <div><strong>AI On-Time</strong><p>{scenarioComparison.ai.on_time_delivery_pct.toFixed(1)}%</p></div>
                <div><strong>Baseline Delay</strong><p>{scenarioComparison.baseline.average_delay_minutes.toFixed(1)} min</p></div>
                <div><strong>AI Delay</strong><p>{scenarioComparison.ai.average_delay_minutes.toFixed(1)} min</p></div>
              </div>
              <ul className="comparison-improvement" aria-label="Improvement summary">
                <li>Overflow reduction: {scenarioComparison.improvement_summary?.overflow_reduction?.toFixed(1)}</li>
                <li>Delay reduction: {scenarioComparison.improvement_summary?.delay_reduction_minutes?.toFixed(1)} min</li>
                <li>Stockouts prevented: {scenarioComparison.ai.stockouts_prevented}</li>
              </ul>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
