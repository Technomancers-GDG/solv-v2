import { Panel } from "../common/UiPrimitives";
import "./InventoryView.css";


/**
 * InventoryView — Demand forecasts and proactive dispatch recommendations.
 */
export function InventoryView({ inventoryForecast, proactiveDispatches, facilityLookup }) {
  return (
    <section className="dashboard-view" aria-label="Inventory Intelligence">
      <div className="inventory-grid">
        {/* Demand Forecasts */}
        <section className="dashboard-panel" aria-label="Demand Forecasts">
        <h2 className="dashboard-panel-title">{"Demand Forecasts"}</h2>
          <ul className="forecast-list" aria-label="Facility demand forecasts">
            {inventoryForecast.map((f, i) => (
              <li className="forecast-card" key={i}>
                <header className="forecast-header">
                  <strong>{f.facility_name}</strong>
                  <span className={`trend-badge ${f.trend}`} aria-label={`Trend: ${f.trend}`}>{f.trend}</span>
                </header>
                <dl className="forecast-stats">
                  <div><dt>Demand</dt><dd>{f.predicted_demand_units} units</dd></div>
                  <div><dt>Safety Stock</dt><dd>{f.safety_stock_units}</dd></div>
                  <div><dt>Reorder Point</dt><dd>{f.reorder_point}</dd></div>
                  <div><dt>Confidence</dt><dd>{(f.confidence * 100).toFixed(0)}%</dd></div>
                </dl>
                {f.recommended_dispatch_count > 0 && (
                  <div className="dispatch-alert" role="alert">
                    Recommend {f.recommended_dispatch_count} dispatch{f.recommended_dispatch_count > 1 ? "es" : ""}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Proactive Dispatch Recommendations */}
        <section className="dashboard-panel" aria-label="Proactive Dispatch Recommendations">
        <h2 className="dashboard-panel-title">{"Proactive Dispatch Recommendations"}</h2>
          {proactiveDispatches.length === 0 ? (
            <p className="empty">All facilities adequately stocked.</p>
          ) : (
            <ul className="proactive-list" aria-label="Proactive dispatch list">
              {proactiveDispatches.map((d, i) => (
                <li className={`proactive-card urgency-${d.urgency}`} key={i}>
                  <header className="proactive-header">
                    <strong>{facilityLookup[d.destination_facility_id]?.name ?? "Facility"}</strong>
                    <span className={`urgency-tag ${d.urgency}`}>{d.urgency}</span>
                  </header>
                  <p>{d.reason}</p>
                  <div className="proactive-meta">{d.recommended_units} units • ETA {d.eta_hours}h</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
