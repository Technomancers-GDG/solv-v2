import { Panel } from "../common/UiPrimitives";

export function ForecastView({ riskForecast = [] }) {
  return (
    <div className="view-forecast">
      <Panel title="Predictive Risk Heatmap (12h forecast)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {riskForecast.map((rf, i) => (
            <div key={i} className="risk-card" style={{background: 'white', boxShadow: 'var(--shadow-sm)', padding: '24px', borderRadius: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                <div style={{fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-main)'}}>{rf.city}</div>
                <div style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: rf.risk > 0.6 ? '#ef4444' : rf.risk > 0.3 ? '#f59e0b' : '#10b981',
                  boxShadow: rf.risk > 0.6 ? '0 0 12px rgba(239,68,68,0.5)' : 'none'
                }} />
              </div>
              <div style={{display: 'flex', gap: '24px', marginBottom: '16px'}}>
                <div>
                  <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px'}}>Risk Score</div>
                  <div style={{fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.03em'}}>{(rf.risk * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px'}}>Closure Risk</div>
                  <div style={{fontSize: '2rem', fontWeight: '800', color: rf.closure_risk > 0.5 ? '#ef4444' : 'var(--text-main)', letterSpacing: '-0.03em'}}>{(rf.closure_risk * 100).toFixed(0)}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{color: 'var(--text-muted)'}}>ETA Multiplier:</span>
                <strong>{(rf.eta_multiplier ?? 1).toFixed(2)}x</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '12px' }}>
                <span style={{color: 'var(--text-muted)'}}>AI Confidence:</span>
                <strong>{(rf.confidence * 100).toFixed(0)}%</strong>
              </div>
              <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', background: 'var(--bg-color)', padding: '12px', borderRadius: '12px'}}>
                <strong>Factors: </strong> {rf.factors?.join(", ")}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
