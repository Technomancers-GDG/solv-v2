import { Panel } from "../common/UiPrimitives";

export function InventoryView({ inventoryForecast = [], proactiveDispatches = [], facilityLookup }) {
  return (
    <div className="view-inventory">
      <div className="bento-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Panel title="Demand Forecasts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {inventoryForecast.map((f, i) => (
              <div key={i} style={{ background: 'white', boxShadow: 'var(--shadow-sm)', borderRadius: '16px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <strong style={{ fontSize: '1.2rem', fontWeight: '800' }}>{f.facility_name}</strong>
                  <span style={{ background: f.trend === 'increasing' ? '#fef2f2' : '#f0fdf4', color: f.trend === 'increasing' ? '#dc2626' : '#16a34a', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>{f.trend} trend</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px', background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
                  <div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800'}}>Demand</div>
                    <div style={{fontSize: '1.2rem', fontWeight: '800'}}>{f.predicted_demand_units}</div>
                  </div>
                  <div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800'}}>Safety Stock</div>
                    <div style={{fontSize: '1.2rem', fontWeight: '800'}}>{f.safety_stock_units}</div>
                  </div>
                  <div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800'}}>Reorder Point</div>
                    <div style={{fontSize: '1.2rem', fontWeight: '800'}}>{f.reorder_point}</div>
                  </div>
                  <div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800'}}>Confidence</div>
                    <div style={{fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-lime-strong)'}}>{(f.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
                {f.recommended_dispatch_count > 0 && (
                  <div style={{ background: 'var(--dark-panel)', color: 'white', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{color: 'var(--accent-lime-strong)'}}>✨ AI RECOMMENDATION:</span> Dispatch {f.recommended_dispatch_count} unit{f.recommended_dispatch_count > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Proactive Dispatch Recommendations">
          {proactiveDispatches.length === 0 ? <div className="empty" style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>All facilities adequately stocked.</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {proactiveDispatches.map((d, i) => (
                <div key={i} style={{ background: d.urgency === 'high' ? '#fef2f2' : 'white', boxShadow: 'var(--shadow-sm)', border: d.urgency === 'high' ? '1px solid #fecaca' : 'none', padding: '24px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '1.1rem', fontWeight: '800' }}>{facilityLookup[d.destination_facility_id]?.name ?? "Facility"}</strong>
                    <span style={{ background: d.urgency === 'high' ? '#ef4444' : 'var(--dark-panel)', color: 'white', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>{d.urgency} urgency</span>
                  </div>
                  <p style={{ margin: '0 0 16px', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500' }}>{d.reason}</p>
                  <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-color)', padding: '12px 16px', borderRadius: '12px' }}>
                    <div><span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>Units:</span> <strong style={{fontSize: '1.1rem'}}>{d.recommended_units}</strong></div>
                    <div><span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>ETA:</span> <strong style={{fontSize: '1.1rem'}}>{d.eta_hours}h</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
