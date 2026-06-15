import { Panel } from "../common/UiPrimitives";

export function ScenariosView({ scenarios = [], scenarioKey, setScenarioKey, scenarioComparison, setScenarioComparison, runAction, apiFetch }) {
  const selected = scenarios.find((s) => s.scenario_key === scenarioKey);
  return (
    <div className="view-scenarios bento-row" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
      <Panel title="Scenario Replay">
        <select value={scenarioKey} onChange={(e) => setScenarioKey(e.target.value)} style={{ width: "100%", padding: "16px", marginBottom: "24px", background: 'white', boxShadow: 'var(--shadow-sm)', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', fontFamily: 'inherit', color: 'var(--text-main)', outline: 'none' }}>
          <option value="">Select scenario...</option>
          {scenarios.map((s) => <option key={s.scenario_key} value={s.scenario_key}>{s.name}</option>)}
        </select>
        {selected && (
          <div style={{ background: "var(--dark-panel)", color: "white", padding: "24px", borderRadius: "20px" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "white", fontSize: '1.2rem', fontWeight: '800' }}>{selected.name}</h4>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", marginBottom: "24px", lineHeight: '1.5' }}>{selected.description}</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "32px" }}>
              <span style={{ background: "rgba(255,255,255,0.1)", padding: "6px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: '700' }}>🏙️ {selected.event_city}</span>
              <span style={{ background: "rgba(239, 68, 68, 0.2)", color: '#fca5a5', padding: "6px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: '700' }}>⚠️ Severity: {(selected.severity ?? 0).toFixed(2)}</span>
              <span style={{ background: "rgba(255,255,255,0.1)", padding: "6px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: '700' }}>⏱️ ETA x{(selected.eta_multiplier ?? 1).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", gap: "12px", flexDirection: 'column' }}>
              <button onClick={() => runAction(`/api/scenarios/${selected.scenario_key}/trigger`, {}, "Triggered")} style={{ width: '100%', padding: "14px", background: "white", color: "var(--dark-panel)", border: "none", borderRadius: "999px", fontWeight: '800', cursor: "pointer", textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Trigger in Live Ops</button>
              <button onClick={async () => { const c = await apiFetch(`/api/scenarios/${selected.scenario_key}/compare`); setScenarioComparison(c); }} style={{ width: '100%', padding: "14px", background: "var(--accent-lime-strong)", color: "var(--dark-panel)", border: "none", borderRadius: "999px", fontWeight: '800', cursor: "pointer", textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Run A/B Comparison</button>
            </div>
          </div>
        )}
      </Panel>
      <Panel title="A/B Analysis: Baseline vs AI">
        {!scenarioComparison ? <div className="empty" style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontWeight: '600' }}>Run comparison to view results.</div> : (
          <div>
            <div style={{ background: 'white', boxShadow: 'var(--shadow-sm)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th scope="col" style={{ paddingBottom: "16px" }}>Metric</th>
                    <th scope="col" style={{ paddingBottom: "16px" }}>Baseline (No AI)</th>
                    <th scope="col" style={{ paddingBottom: "16px" }}>AI Optimized</th>
                    <th scope="col" style={{ paddingBottom: "16px" }}>Delta</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px 0", fontWeight: '600' }}>On-Time Delivery %</td>
                    <td style={{ padding: "16px 0", color: 'var(--text-muted)' }}>{(scenarioComparison.baseline?.on_time_delivery_pct ?? 0).toFixed(1)}%</td>
                    <td style={{ padding: "16px 0", color: "var(--dark-panel)", fontWeight: "800", fontSize: '1.1rem' }}>{(scenarioComparison.ai?.on_time_delivery_pct ?? 0).toFixed(1)}%</td>
                    <td style={{ padding: "16px 0", color: "#10b981", fontWeight: '700' }}>+{(scenarioComparison.improvement_summary?.on_time_delta_pct ?? 0).toFixed(1)}%</td>
                  </tr>
                  <tr style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px 0", fontWeight: '600' }}>Average Delay</td>
                    <td style={{ padding: "16px 0", color: 'var(--text-muted)' }}>{(scenarioComparison.baseline?.average_delay_minutes ?? 0).toFixed(1)} min</td>
                    <td style={{ padding: "16px 0", color: "var(--dark-panel)", fontWeight: "800", fontSize: '1.1rem' }}>{(scenarioComparison.ai?.average_delay_minutes ?? 0).toFixed(1)} min</td>
                    <td style={{ padding: "16px 0", color: "#10b981", fontWeight: '700' }}>-{(scenarioComparison.improvement_summary?.delay_reduction_minutes ?? 0).toFixed(1)} min</td>
                  </tr>
                  <tr style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px 0", fontWeight: '600' }}>Stockouts Prevented</td>
                    <td style={{ padding: "16px 0", color: 'var(--text-muted)' }}>{scenarioComparison.baseline?.stockouts_prevented ?? 0}</td>
                    <td style={{ padding: "16px 0", color: "var(--dark-panel)", fontWeight: "800", fontSize: '1.1rem' }}>{scenarioComparison.ai?.stockouts_prevented ?? 0}</td>
                    <td style={{ padding: "16px 0", color: "#10b981", fontWeight: '700' }}>+{scenarioComparison.improvement_summary?.stockout_delta ?? 0}</td>
                  </tr>
                  <tr style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px 0", fontWeight: '600' }}>Overflow Events</td>
                    <td style={{ padding: "16px 0", color: 'var(--text-muted)' }}>{scenarioComparison.baseline?.overflow_events ?? 0}</td>
                    <td style={{ padding: "16px 0", color: "var(--dark-panel)", fontWeight: "800", fontSize: '1.1rem' }}>{scenarioComparison.ai?.overflow_events ?? 0}</td>
                    <td style={{ padding: "16px 0", color: "#10b981", fontWeight: '700' }}>-{scenarioComparison.improvement_summary?.overflow_reduction ?? 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              <div style={{ background: "var(--dark-panel)", color: 'white', padding: "24px", borderRadius: "20px", display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: '800', marginBottom: '8px' }}>CO2 EMISSIONS SAVED</div>
                <div style={{ color: "var(--accent-lime-strong)", fontSize: "2rem", fontWeight: "800" }}>{(scenarioComparison.ai?.co2_saved_kg ?? 0).toFixed(1)} kg</div>
              </div>
              <div style={{ background: "var(--dark-panel)", color: 'white', padding: "24px", borderRadius: "20px", display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: '800', marginBottom: '8px' }}>IDLE TIME PREVENTED</div>
                <div style={{ color: "white", fontSize: "2rem", fontWeight: "800" }}>{(scenarioComparison.ai?.idle_minutes_prevented ?? 0).toFixed(1)} min</div>
              </div>
              <div style={{ background: "var(--dark-panel)", color: 'white', padding: "24px", borderRadius: "20px", display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: '800', marginBottom: '8px' }}>TOTAL AI REROUTES</div>
                <div style={{ color: "var(--accent-lime-strong)", fontSize: "2rem", fontWeight: "800" }}>{scenarioComparison.ai?.reroute_count ?? 0}</div>
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
