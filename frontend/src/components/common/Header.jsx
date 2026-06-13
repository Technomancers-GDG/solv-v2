import "./Header.css";

export function Header({ onStart, onPause, onResume, onReset }) {
  return (
    <header className="hero">
      <div>
        <p className="eyebrow">Project Overview</p>
        <h1>Resilient Essential Goods Operations</h1>
        <p className="hero-copy">
          Coordinating deliveries for medicines, vaccines, and relief materials across active routes.
          Ensuring optimal paths and tracking on-ground impacts.
        </p>
      </div>
      <div className="hero-controls" role="group" aria-label="Simulation Controls">
        <button className="primary-btn" onClick={onStart}>Start</button>
        <button onClick={onPause}>Pause</button>
        <button onClick={onResume}>Resume</button>
        <button className="danger" onClick={onReset}>
          Reset
        </button>
      </div>
    </header>
  );
}
