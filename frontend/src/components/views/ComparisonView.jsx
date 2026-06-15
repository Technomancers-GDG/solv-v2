import { useEffect, useState, useMemo } from "react";
import { Panel } from "../common/UiPrimitives";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from "recharts";
import { formatINRCompact } from "../../App";

export function ComparisonView({ apiFetch }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaryData, setSummaryData] = useState(null);
  const [disruptionData, setDisruptionData] = useState(null);
  const [tripsData, setTripsData] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sum, dis, tr] = await Promise.all([
          apiFetch("/api/comparison/summary"),
          apiFetch("/api/comparison/by-disruption"),
          apiFetch("/api/comparison/per-trip")
        ]);
        setSummaryData(sum);
        setDisruptionData(dis);
        setTripsData(tr.trips || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [apiFetch]);

  // Transform disruption data for Grouped Bar Chart
  const groupedBarData = useMemo(() => {
    if (!disruptionData) return [];
    const calm = disruptionData.calm?.baseline || {};
    const calmAi = disruptionData.calm?.ai || {};
    const disrupted = disruptionData.disrupted?.baseline || {};
    const disruptedAi = disruptionData.disrupted?.ai || {};
    return [
      {
        name: "Calm Period",
        BaselineDelay: calm.average_delay_minutes || 0,
        AIDelay: calmAi.average_delay_minutes || 0,
        "Baseline Overflow": calm.overflow_events || 0,
        "AI Overflow": calmAi.overflow_events || 0,
      },
      {
        name: "Disruption",
        BaselineDelay: disrupted.average_delay_minutes || 0,
        AIDelay: disruptedAi.average_delay_minutes || 0,
        "Baseline Overflow": disrupted.overflow_events || 0,
        "AI Overflow": disruptedAi.overflow_events || 0,
      },
    ];
  }, [disruptionData]);

  const scatterData = useMemo(() => {
    return tripsData.map(t => ({
      baselineTime: t.baseline_trip_minutes,
      aiTime: t.ai_trip_minutes,
      costSaved: Math.max(0, t.baseline_cost - t.ai_cost),
      action: t.ai_action
    }));
  }, [tripsData]);

  if (loading) return <div className="loading" style={{textAlign: 'center', padding: '60px', color: 'var(--text-muted)'}}>Generating statistical comparison...</div>;
  if (error) return <div className="banner error">{error}</div>;
  if (!summaryData) return <div className="loading" style={{textAlign: 'center', padding: '60px', color: 'var(--text-muted)'}}>No comparison data available.</div>;

  const { baseline, ai, improvement, stats } = summaryData;
  const imp = improvement || {};
  const st = stats || {};

  return (
    <section className="analytics-layout comparison-view">
      <div className="view-header" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>AI vs Baseline Performance (A/B Test)</h2>
        <p style={{ color: "var(--text-muted)", fontSize: '1.1rem' }}>Rigorous statistical comparison tracking per-trip metrics against a non-AI baseline.</p>
      </div>

      <div className="bento-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Delivery Delay Reduction</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>{(imp.delay_reduction_minutes ?? 0).toFixed(1)} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>min/trip</span></div>
          <div style={{ fontSize: '0.8rem', color: st.statistically_significant ? '#10b981' : 'var(--text-muted)', marginTop: '8px', fontWeight: '700' }} title={`p-value: ${st.p_value_time?.toExponential(2) || "—"}`}>
            {st.statistically_significant ? "✓ Statistically Significant" : "Not Significant"}
          </div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Overflow Events Prevented</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>{imp.overflow_reduction ?? 0} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>events</span></div>
        </div>

        <div style={{ background: 'var(--dark-panel)', padding: '24px', borderRadius: '20px', color: 'white' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Cost Saved (Total)</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-lime-strong)' }}>₹{Math.round((imp.delay_reduction_minutes ?? 0) * 100).toLocaleString()}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '8px', fontWeight: '700' }}>Cohen's d: {st.effect_size_cohens_d?.toFixed(2) ?? "—"}</div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Stockouts Prevented</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>{imp.stockout_delta ?? 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: '600' }}>facilities saved</div>
        </div>
      </div>

      <div className="bento-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginTop: "24px" }}>
        
        <Panel title="Performance by Condition (Delay Minutes)">
          <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ height: "300px", width: "100%" }}>
              <ResponsiveContainer>
                <BarChart data={groupedBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontWeight: 600, fontSize: 12}} />
                  <YAxis stroke="var(--text-muted)" tick={{fontWeight: 600, fontSize: 12}} />
                  <RechartsTooltip cursor={{fill: 'var(--bg-color)'}} contentStyle={{ backgroundColor: "var(--dark-panel)", borderColor: "var(--dark-panel)", color: "white", borderRadius: '12px', fontWeight: 600 }} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar dataKey="BaselineDelay" fill="var(--text-muted)" name="Baseline Delay (min)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="AIDelay" fill="var(--accent-lime)" name="AI Delay (min)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>

        <Panel title="Per-Trip Scatter: Baseline vs AI Time">
          <div style={{ background: 'white', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ height: "300px", width: "100%" }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" dataKey="baselineTime" name="Baseline Time" unit="m" stroke="var(--text-muted)" tick={{fontWeight: 600, fontSize: 12}} label={{ value: "Baseline Time (min)", position: "insideBottom", offset: -10, fill: "var(--text-muted)", fontWeight: 700 }} />
                  <YAxis type="number" dataKey="aiTime" name="AI Time" unit="m" stroke="var(--text-muted)" tick={{fontWeight: 600, fontSize: 12}} label={{ value: "AI Time (min)", angle: -90, position: "insideLeft", fill: "var(--text-muted)", fontWeight: 700 }} />
                  <ZAxis type="number" dataKey="costSaved" range={[40, 400]} name="Cost Saved" />
                  <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "var(--dark-panel)", borderColor: "var(--dark-panel)", borderRadius: '12px', color: 'white', fontWeight: 600 }} />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Scatter name="Trips" data={scatterData} fill="var(--accent-lime)">
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.aiTime < entry.baselineTime ? "var(--accent-lime)" : "var(--text-muted)"} opacity={0.8} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>

      </div>
    </section>
  );
}
