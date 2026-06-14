import "./Header.css";

export function Header({ onStart, onPause, onResume, onReset, status = "running", simTime = "2026-01-03 16:58:13", speed = "120x", activeTrucks = 12 }) {
  return (
    <header className="app-header">
      <div className="app-header-top">
        <div className="app-branding">
          <div className="app-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </div>
          <h1>Command Center</h1>
          <span className="badge-prototype">HACKATHON PROTOTYPE</span>
        </div>

        <div className="app-controls">
          <div className="user-profile">
            <div className="avatar">A</div>
            <div className="user-info">
              <span className="user-name">Local Admin</span>
              <span className="user-role">System Operator</span>
            </div>
          </div>
          <button className="btn-logout">Logout</button>
        </div>
      </div>

      <div className="app-toolbar">
        <div className="toolbar-status">
          <div className="status-indicator">
            <span className={`status-dot ${status}`}></span>
            <span className="status-text">{status}</span>
          </div>
          <div className="status-divider"></div>
          <div className="status-metric">
            <span className="metric-label">Sim Time</span>
            <span className="metric-value">{simTime}</span>
          </div>
          <div className="status-metric">
            <span className="metric-label">Speed</span>
            <span className="metric-value">{speed}</span>
          </div>
          <div className="status-metric">
            <span className="metric-label">Active</span>
            <span className="metric-value">{activeTrucks} trucks</span>
          </div>
        </div>

        <div className="toolbar-actions">
          <button className="btn-action primary" onClick={onStart}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start
          </button>
          <button className="btn-action secondary" onClick={onPause}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            Pause
          </button>
          <button className="btn-action secondary" onClick={onResume}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Resume
          </button>
          <button className="btn-action danger" onClick={onReset}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
