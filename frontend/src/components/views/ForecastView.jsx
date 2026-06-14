import { useState, useMemo } from "react";
import { Panel } from "../common/UiPrimitives";

export function ForecastView({ riskForecast = [] }) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const filteredForecast = useMemo(() => {
    return riskForecast.filter((rf) => {
      const matchesSearch =
        !search || rf.city?.toLowerCase().includes(search.toLowerCase());
      const matchesRisk =
        riskFilter === "all" ||
        (riskFilter === "high" && rf.risk > 0.6) ||
        (riskFilter === "medium" && rf.risk > 0.3 && rf.risk <= 0.6) ||
        (riskFilter === "low" && rf.risk <= 0.3);
      return matchesSearch && matchesRisk;
    });
  }, [riskForecast, search, riskFilter]);

  return (
    <div className="view-forecast">
      <Panel title={`Predictive Risk Heatmap (12h forecast) — ${filteredForecast.length} cities`}>
        <div className="search-controls">
          <div className="search-input-wrap">
            <span className="search-input-icon">&#x1F50D;</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search by city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
        <div className="heatmap-table">
          <table>
            <thead><tr><th scope="col">City</th><th scope="col">Risk Score</th><th scope="col">ETA Multiplier</th><th scope="col">Closure Risk</th><th scope="col">Confidence</th><th scope="col">Contributing Factors</th></tr></thead>
            <tbody>
              {filteredForecast.length === 0 ? (
                <tr><td colSpan="6" className="empty">No forecasts match your criteria.</td></tr>
              ) : filteredForecast.map((rf, i) => (
                <tr key={i} className={`risk-row-${rf.risk > 0.6 ? "high" : rf.risk > 0.3 ? "medium" : "low"}`}>
                  <td><strong>{rf.city}</strong></td>
                  <td>{(rf.risk * 100).toFixed(1)}%</td>
                  <td>{(rf.eta_multiplier ?? 1).toFixed(2)}x</td>
                  <td>{(rf.closure_risk * 100).toFixed(1)}%</td>
                  <td>{(rf.confidence * 100).toFixed(0)}%</td>
                  <td>{rf.factors?.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
