import { Panel } from "../common/UiPrimitives";

export function ScenariosView({ scenarios, scenarioKey, setScenarioKey, scenarioComparison, setScenarioComparison, runAction, apiFetch }) {
  const selected = scenarios.find((s) => s.scenario_key === scenarioKey);
  return (
    <div className="view-scenarios" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
      <Panel title="Scenario Replay">
        <select value={scenarioKey} onChange={(e) => setScenarioKey(e.target.value)} className="scenario-select" style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}>
          <option value="">Select scenario...</option>
          {scenarios.map((s) => <option key={s.scenario_key} value={s.scenario_key}>{s.name}</option>)}
        </select>
        {selected && (
          <div className="scenario-detail" style={{ background: "#1e293b", padding: "1rem", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", color: "#f8fafc" }}>{selected.name}</h4>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1rem" }}>{selected.description}</p>
            <div className="scenario-meta" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              <span style={{ background: "#334155", padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem" }}>🏙️ {selected.event_city}</span>
              <span style={{ background: "#334155", padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem" }}>⚠️ Severity: {selected.severity.toFixed(2)}</span>
              <span style={{ background: "#334155", padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem" }}>⏱️ ETA x{selected.eta_multiplier.toFixed(2)}</span>
            </div>
            <div className="scenario-actions" style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => runAction(`/api/scenarios/${selected.scenario_key}/trigger`, {}, "Triggered")} style={{ flex: 1, padding: "0.5rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Trigger in Live Ops</button>
              <button onClick={async () => { const c = await apiFetch(`/api/scenarios/${selected.scenario_key}/compare`); setScenarioComparison(c); }} style={{ flex: 2, padding: "0.5rem", background: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Run A/B Comparison</button>
            </div>
          </div>
        )}
      </Panel>
      <Panel title="A/B Analysis: Baseline vs AI">
        {!scenarioComparison ? <div className="empty" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Run comparison to view results.</div> : (
          <div className="comparison-result">
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.5rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", textAlign: "left" }}>
                  <th scope="col" style={{ padding: "0.5rem" }}>Metric</th>
                  <th scope="col" style={{ padding: "0.5rem" }}>Baseline (No AI)</th>
                  <th scope="col" style={{ padding: "0.5rem" }}>AI Optimized</th>
                  <th scope="col" style={{ padding: "0.5rem" }}>Delta</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px dashed #1e293b" }}>
                  <td style={{ padding: "0.5rem" }}>On-Time Delivery %</td>
                  <td style={{ padding: "0.5rem" }}>{scenarioComparison.baseline.on_time_delivery_pct.toFixed(1)}%</td>
                  <td style={{ padding: "0.5rem", color: "#10b981", fontWeight: "bold" }}>{scenarioComparison.ai.on_time_delivery_pct.toFixed(1)}%</td>
                  <td style={{ padding: "0.5rem" }}>+{scenarioComparison.improvement_summary.on_time_delta_pct.toFixed(1)}%</td>
                </tr>
                <tr style={{ borderBottom: "1px dashed #1e293b" }}>
                  <td style={{ padding: "0.5rem" }}>Average Delay</td>
                  <td style={{ padding: "0.5rem" }}>{scenarioComparison.baseline.average_delay_minutes.toFixed(1)} min</td>
                  <td style={{ padding: "0.5rem" }}>{scenarioComparison.ai.average_delay_minutes.toFixed(1)} min</td>
                  <td style={{ padding: "0.5rem", color: "#10b981" }}>-{scenarioComparison.improvement_summary.delay_reduction_minutes.toFixed(1)} min</td>
                </tr>
                <tr style={{ borderBottom: "1px dashed #1e293b" }}>
                  <td style={{ padding: "0.5rem" }}>Stockouts Prevented</td>
                  <td style={{ padding: "0.5rem" }}>{scenarioComparison.baseline.stockouts_prevented}</td>
                  <td style={{ padding: "0.5rem", color: "#f59e0b", fontWeight: "bold" }}>{scenarioComparison.ai.stockouts_prevented}</td>
                  <td style={{ padding: "0.5rem" }}>+{scenarioComparison.improvement_summary.stockout_delta}</td>
                </tr>
                <tr style={{ borderBottom: "1px dashed #1e293b" }}>
                  <td style={{ padding: "0.5rem" }}>Overflow Events</td>
                  <td style={{ padding: "0.5rem" }}>{scenarioComparison.baseline.overflow_events}</td>
                  <td style={{ padding: "0.5rem" }}>{scenarioComparison.ai.overflow_events}</td>
                  <td style={{ padding: "0.5rem", color: "#10b981" }}>-{scenarioComparison.improvement_summary.overflow_reduction}</td>
                </tr>
              </tbody>
            </table>
            
            <div style={{ display: "flex", gap: "1rem", background: "#0f172a", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ color: "#94a3b8", fontSize: "0.8rem", textTransform: "uppercase" }}>CO2 Emissions Saved</div>
                <div style={{ color: "#10b981", fontSize: "1.5rem", fontWeight: "bold" }}>{scenarioComparison.ai.co2_saved_kg.toFixed(1)} kg</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", borderLeft: "1px solid #334155" }}>
                <div style={{ color: "#94a3b8", fontSize: "0.8rem", textTransform: "uppercase" }}>Idle Time Prevented</div>
                <div style={{ color: "#3b82f6", fontSize: "1.5rem", fontWeight: "bold" }}>{scenarioComparison.ai.idle_minutes_prevented.toFixed(1)} min</div>
              </div>
              <div style={{ flex: 1, textAlign: "center", borderLeft: "1px solid #334155" }}>
                <div style={{ color: "#94a3b8", fontSize: "0.8rem", textTransform: "uppercase" }}>Total Reroutes</div>
                <div style={{ color: "#f59e0b", fontSize: "1.5rem", fontWeight: "bold" }}>{scenarioComparison.ai.reroute_count}</div>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
