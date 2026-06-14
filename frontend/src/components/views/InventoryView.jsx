import { useState, useMemo } from "react";
import { Panel } from "../common/UiPrimitives";

export function InventoryView({ inventoryForecast = [], proactiveDispatches = [], facilityLookup }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const sortedForecast = useMemo(() => {
    let list = [...inventoryForecast];
    if (search) {
      list = list.filter((f) =>
        f.facility_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "demand": return (b.predicted_demand_units ?? 0) - (a.predicted_demand_units ?? 0);
        case "confidence": return (b.confidence ?? 0) - (a.confidence ?? 0);
        case "name": return (a.facility_name ?? "").localeCompare(b.facility_name ?? "");
        default: return 0;
      }
    });
    return list;
  }, [inventoryForecast, search, sortBy]);

  const filteredDispatches = useMemo(() => {
    if (urgencyFilter === "all") return proactiveDispatches;
    return proactiveDispatches.filter((d) => d.urgency === urgencyFilter);
  }, [proactiveDispatches, urgencyFilter]);

  return (
    <div className="view-inventory">
      <div className="inventory-grid">
        <Panel title={`Demand Forecasts (${sortedForecast.length})`}>
          <div className="search-controls">
            <div className="search-input-wrap">
              <span className="search-input-icon">&#x1F50D;</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search facilities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="demand">Sort by Demand</option>
              <option value="confidence">Sort by Confidence</option>
            </select>
          </div>
          <div className="forecast-list">
            {sortedForecast.length === 0 ? (
              <div className="empty">No forecasts match your search.</div>
            ) : sortedForecast.map((f, i) => (
              <div className="forecast-card" key={i}>
                <strong>{f.facility_name}</strong>
                <span className={`trend-badge ${f.trend}`}>{f.trend}</span>
                <div className="forecast-stats">
                  <div>Demand: {f.predicted_demand_units} units</div>
                  <div>Safety Stock: {f.safety_stock_units}</div>
                  <div>Reorder Point: {f.reorder_point}</div>
                  <div>Confidence: {(f.confidence * 100).toFixed(0)}%</div>
                </div>
                {f.recommended_dispatch_count > 0 && (
                  <div className="dispatch-alert">
                    Recommend {f.recommended_dispatch_count} dispatch{f.recommended_dispatch_count > 1 ? "es" : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Proactive Dispatch Recommendations">
          {proactiveDispatches.length > 0 && (
            <div className="search-controls">
              <select
                className="filter-select"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
              >
                <option value="all">All Urgency</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          )}
          {filteredDispatches.length === 0 ? (
            <div className="empty">No proactive dispatches needed.</div>
          ) : (
            <div className="proactive-list">
              {filteredDispatches.map((d, i) => (
                <div className={`proactive-card urgency-${d.urgency}`} key={i}>
                  <div className="proactive-header">
                    <strong>{facilityLookup[d.destination_facility_id]?.name ?? "Facility"}</strong>
                    <span className={`urgency-tag ${d.urgency}`}>{d.urgency}</span>
                  </div>
                  <p>{d.reason}</p>
                  <div className="proactive-meta">{d.recommended_units} units &bull; ETA {d.eta_hours}h</div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
