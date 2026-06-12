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

  if (loading) return <div className="loading">Generating statistical comparison...</div>;
  if (error) return <div className="banner error">{error}</div>;
  if (!summaryData) return <div className="loading">No comparison data available.</div>;

  const { baseline, ai, improvement, stats } = summaryData;
  const imp = improvement || {};
  const st = stats || {};

  return (
    <section className="analytics-layout comparison-view">
      <div className="view-header" style={{ marginBottom: "2rem" }}>
        <h2>AI vs Baseline Performance (A/B Test)</h2>
        <p style={{ color: "#94a3b8" }}>Rigorous statistical comparison tracking per-trip metrics against a non-AI baseline.</p>
      </div>

      <div className="metrics-summary">
        <div className="metric-card">
          <span className="metric-label">Delivery Delay Reduction</span>
          <span className="metric-value">{(imp.delay_reduction_minutes ?? 0).toFixed(1)} <span className="metric-unit">min/trip</span></span>
          <span className="metric-trend positive" title={`p-value: ${st.p_value_time?.toExponential(2) || "—"}`}>
            {st.statistically_significant ? "Statistically Significant (p < 0.05)" : "Not Significant"}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Overflow Events Prevented</span>
          <span className="metric-value">{imp.overflow_reduction ?? 0} <span className="metric-unit">events</span></span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Cost Saved (Total)</span>
          <span className="metric-value">₹{Math.round((imp.delay_reduction_minutes ?? 0) * 100).toLocaleString()}</span>
          <span className="metric-trend positive">Cohen's d: {st.effect_size_cohens_d?.toFixed(2) ?? "—"}</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Stockouts Prevented</span>
          <span className="metric-value">{imp.stockout_delta ?? 0}</span>
          <span className="metric-unit">facilities saved</span>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
        
        <Panel title="Performance by Condition (Delay Minutes)">
          <div style={{ height: "300px", width: "100%", padding: "1rem" }}>
            <ResponsiveContainer>
              <BarChart data={groupedBarData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="BaselineDelay" fill="#64748b" name="Baseline Delay (min)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="AIDelay" fill="#10b981" name="AI Delay (min)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Per-Trip Scatter: Baseline vs AI Time">
          <div style={{ height: "300px", width: "100%", padding: "1rem" }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" dataKey="baselineTime" name="Baseline Time" unit="m" stroke="#94a3b8" label={{ value: "Baseline Time (min)", position: "insideBottom", offset: -10, fill: "#94a3b8" }} />
                <YAxis type="number" dataKey="aiTime" name="AI Time" unit="m" stroke="#94a3b8" label={{ value: "AI Time (min)", angle: -90, position: "insideLeft", fill: "#94a3b8" }} />
                <ZAxis type="number" dataKey="costSaved" range={[40, 400]} name="Cost Saved" />
                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155" }} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Scatter name="Trips" data={scatterData} fill="#10b981">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.aiTime < entry.baselineTime ? "#10b981" : "#64748b"} opacity={0.7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Panel>

      </div>
    </section>
  );
}
