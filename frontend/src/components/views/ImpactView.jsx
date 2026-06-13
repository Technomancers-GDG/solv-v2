import { Panel, MetricCard as StatsCard } from "../common/UiPrimitives";
import "./ImpactView.css";


/**
 * ImpactView — SDG alignment metrics and sustainability impact dashboard.
 */
export function ImpactView({ metrics }) {
  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <section className="dashboard-view" aria-label="Impact & SDG Dashboard">
      {/* Impact KPIs */}
      <div className="metrics-grid" role="list" aria-label="Impact metrics">
        <StatsCard label="Financial Costs Saved (AI)" value={formatINR(metrics?.financial_costs_saved_usd)} tone="green" />
        <StatsCard label="Operational Costs Incurred" value={formatINR(metrics?.financial_costs_incurred_usd)} tone="coral" />
        <StatsCard label="CO₂ Saved" value={`${(metrics?.co2_saved_kg ?? 0).toFixed(1)} kg`} tone="green" />
        <StatsCard label="Idle Minutes Prevented" value={`${(metrics?.idle_minutes_prevented ?? 0).toFixed(0)}`} tone="blue" />
        <StatsCard label="On-Time Delivery" value={`${metrics?.on_time_delivery_pct ?? 0}%`} tone="teal" />
        <StatsCard label="Warehouse Utilization" value={`${metrics?.warehouse_utilization_pct ?? 0}%`} tone="amber" />
        <StatsCard label="Critical Deliveries Saved" value={metrics?.critical_deliveries_saved ?? 0} tone="coral" />
        <StatsCard label="Stockouts Prevented" value={metrics?.stockouts_prevented ?? 0} tone="purple" />
      </div>

      {/* SDG Alignment */}
      <section className="dashboard-panel" aria-label="SDG Alignment">
        <h2 className="dashboard-panel-title">{"SDG Alignment"}</h2>
        <ul className="sdg-grid" aria-label="UN Sustainable Development Goals alignment">
          <li className="sdg-card sdg-9">
            <strong>SDG 9</strong>
            <span>Industry &amp; Innovation</span>
            <p>AI-driven logistics optimization and predictive analytics</p>
          </li>
          <li className="sdg-card sdg-11">
            <strong>SDG 11</strong>
            <span>Sustainable Cities</span>
            <p>Reduced congestion and emissions through intelligent routing</p>
          </li>
          <li className="sdg-card sdg-12">
            <strong>SDG 12</strong>
            <span>Responsible Consumption</span>
            <p>Wastage prevention through demand forecasting</p>
          </li>
          <li className="sdg-card sdg-13">
            <strong>SDG 13</strong>
            <span>Climate Action</span>
            <p>CO₂ reduction via optimized fleet operations</p>
          </li>
        </ul>
      </section>
    </section>
  );
}
