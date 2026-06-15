import { Panel, MetricCard, ProgressBar } from "../common/UiPrimitives";

export function LiveOpsView({ metrics, deferredVehicles = [], objectiveLookup }) {
  return (
    <div className="view-liveops">
      <div className="bento-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="bento-card" style={{ padding: '24px' }}>
          <div className="eyebrow" style={{marginBottom: "8px"}}>🚚 ACTIVE TRUCKS</div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>{metrics?.active_trucks ?? 0}</div>
        </div>
        <div className="bento-card" style={{ padding: '24px' }}>
          <div className="eyebrow" style={{marginBottom: "8px"}}>⏳ QUEUED</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-muted)' }}>{metrics?.queued_trucks ?? 0}</div>
        </div>
        <div className="bento-card" style={{ padding: '24px' }}>
          <div className="eyebrow" style={{marginBottom: "8px"}}>🔄 REROUTES</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-lime-strong)' }}>{metrics?.reroute_count ?? 0}</div>
        </div>
        <div className="bento-card" style={{ padding: '24px', background: 'var(--dark-panel)', color: 'white' }}>
          <div className="eyebrow" style={{marginBottom: "8px", color: 'rgba(255,255,255,0.7)'}}>⏱️ IDLE PREVENTED</div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }}>{`${(metrics?.idle_minutes_prevented ?? 0).toFixed(0)} min`}</div>
        </div>
      </div>
      
      <div className="bento-card" style={{ padding: '32px' }}>
        <div className="eyebrow" style={{marginBottom: "24px"}}>📋 VEHICLE PROGRESS</div>
        <div className="table-wrap" style={{ border: 'none', background: 'transparent' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ paddingBottom: '16px' }} scope="col">Vehicle</th>
                <th style={{ paddingBottom: '16px' }} scope="col">Status</th>
                <th style={{ paddingBottom: '16px' }} scope="col">Objective</th>
                <th style={{ paddingBottom: '16px' }} scope="col">Progress</th>
                <th style={{ paddingBottom: '16px' }} scope="col">Payload</th>
                <th style={{ paddingBottom: '16px' }} scope="col">ETA</th>
                <th style={{ paddingBottom: '16px' }} scope="col">AI Action</th>
              </tr>
            </thead>
            <tbody>
              {deferredVehicles.slice(0, 30).map((v) => (
                <tr key={v.vehicle_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 0', fontWeight: '600' }}>{v.identifier}</td>
                  <td style={{ padding: '16px 0' }}><span className={`status-badge ${v.status}`}>{v.status}</span></td>
                  <td style={{ padding: '16px 0', color: 'var(--text-muted)' }}>{objectiveLookup[v.objective_id]?.name ?? "-"}</td>
                  <td style={{ padding: '16px 0' }}><ProgressBar value={v.progress_pct} compact /></td>
                  <td style={{ padding: '16px 0', fontWeight: '600' }}>{v.payload_units}</td>
                  <td style={{ padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{v.eta ? v.eta.slice(0, 19).replace("T", " ") : "-"}</td>
                  <td style={{ padding: '16px 0' }}>
                    <span style={{ background: v.recommendation_action === 'continue' ? 'var(--bg-color)' : 'var(--accent-lime-strong)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      {v.recommendation_action ?? "continue"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
