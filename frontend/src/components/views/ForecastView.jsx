import { Panel } from "../common/UiPrimitives";

/**
 * ForecastView — 12-hour predictive risk heatmap table.
 */
export function ForecastView({ riskForecast }) {
  return (
    <section className="view-forecast" aria-label="Risk Forecast">
      <Panel title="Predictive Risk Heatmap (12h forecast)">
        <div className="heatmap-table" role="region" aria-label="Risk heatmap table" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">City</th>
                <th scope="col">Risk Score</th>
                <th scope="col">ETA Multiplier</th>
                <th scope="col">Closure Risk</th>
                <th scope="col">Confidence</th>
                <th scope="col">Contributing Factors</th>
              </tr>
            </thead>
            <tbody>
              {riskForecast.map((rf, i) => {
                const riskLevel = rf.risk > 0.6 ? "high" : rf.risk > 0.3 ? "medium" : "low";
                return (
                  <tr key={i}>
                    <td><strong>{rf.city}</strong></td>
                    <td><span className={`risk-badge ${riskLevel}`}>{(rf.risk * 100).toFixed(1)}%</span></td>
                    <td>{rf.eta_multiplier.toFixed(2)}x</td>
                    <td>{(rf.closure_risk * 100).toFixed(1)}%</td>
                    <td>{(rf.confidence * 100).toFixed(0)}%</td>
                    <td className="factors-cell">{rf.factors?.join(", ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}
