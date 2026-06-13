import { Panel } from "../common/UiPrimitives";
import "./DriverMobileView.css";


/**
 * DriverMobileView — Mobile-first driver interface with voice incident
 * reporting and pending instruction management.
 */
export function DriverMobileView({
  drivers, selectedDriverId, setSelectedDriverId, driverMobile,
  voice, voiceConfig, voiceIncidentType, setVoiceIncidentType,
  voiceNote, setVoiceNote, onMessage, onError, refreshAll, apiFetch,
}) {
  const selectedDriver = drivers.find((d) => String(d.id) === String(selectedDriverId));

  const submitVoiceIncident = async () => {
    if (!selectedDriverId) return;
    try {
      await apiFetch("/api/driver/incidents", {
        method: "POST",
        body: JSON.stringify({
          driver_profile_id: Number(selectedDriverId),
          vehicle_id: null,
          city: "Unknown",
          incident_type: voiceIncidentType,
          severity: 0.7,
          note: voiceNote || voice.transcript || "Voice reported",
        }),
      });
      onMessage("Voice incident reported.");
      voice.reset();
      setVoiceNote("");
      refreshAll(false);
    } catch (err) { onError(err.message); }
  };

  return (
    <section className="dashboard-view" aria-label="Driver Mobile Interface">
      <div className="driver-grid">
        {/* Driver selection */}
        <section className="dashboard-panel" aria-label="Driver Selection">
        <h2 className="dashboard-panel-title">{"Driver Selection"}</h2>
          <div className="field">
            <label htmlFor="driver-select">Active driver</label>
            <select id="driver-select" value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} className="driver-select">
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} (rating {d.override_rating.toFixed(2)})</option>)}
            </select>
          </div>
          {selectedDriver && (
            <dl className="driver-stats" aria-label="Selected driver stats">
              <div><dt>Override Rating</dt><dd>{selectedDriver.override_rating.toFixed(2)}</dd></div>
              <div><dt>Confidence</dt><dd>{(selectedDriver.confidence * 100).toFixed(0)}%</dd></div>
              <div><dt>Accept Bias</dt><dd>{(selectedDriver.accept_recommendation_bias * 100).toFixed(0)}%</dd></div>
            </dl>
          )}
        </section>

        {/* Voice incident reporting */}
        <section className="dashboard-panel" aria-label="Voice Incident Reporting">
        <h2 className="dashboard-panel-title">{"Voice Incident Reporting"}</h2>
          <div className="voice-panel" role="group" aria-label="Voice incident controls">
            <button
              className={`voice-btn ${voice.isListening ? "listening" : ""}`}
              onClick={() => voice.start("en-IN")}
              aria-label={voice.isListening ? "Listening for voice input" : "Press to speak"}
              aria-pressed={voice.isListening}
            >
              {voice.isListening ? "\u25CF Listening..." : "\uD83C\uDFA4 Hold to Speak"}
            </button>
            {voice.transcript && (
              <div className="voice-transcript" role="status" aria-live="polite">
                <strong>Heard:</strong> {voice.transcript}
              </div>
            )}
            <div className="field">
              <label htmlFor="incident-type">Incident type</label>
              <select id="incident-type" value={voiceIncidentType} onChange={(e) => setVoiceIncidentType(e.target.value)}>
                {voiceConfig?.incident_types?.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="voice-notes">Additional notes</label>
              <input id="voice-notes" placeholder="Additional notes" value={voiceNote} onChange={(e) => setVoiceNote(e.target.value)} />
            </div>
            <button onClick={submitVoiceIncident} disabled={!voice.transcript} aria-label="Submit voice incident report">Report Incident</button>
          </div>
        </section>

        {/* Pending instructions */}
        <section className="dashboard-panel" aria-label="Pending Instructions">
        <h2 className="dashboard-panel-title">{"Pending Instructions"}</h2>
          {driverMobile?.pending_instructions?.length === 0 ? (
            <p className="empty">No pending instructions.</p>
          ) : (
            <ul className="instruction-list" aria-label="Driver instructions">
              {driverMobile?.pending_instructions?.map((inst) => (
                <li className="instruction-card" key={inst.recommendation_id}>
                  <header className="inst-header">
                    <strong>{inst.vehicle_identifier}</strong>
                    <span>{inst.action.replaceAll("_", " ")}</span>
                  </header>
                  <p>{inst.explanation}</p>
                  <div className="inst-actions" role="group" aria-label={`Actions for ${inst.vehicle_identifier}`}>
                    <button onClick={async () => { await apiFetch("/api/driver/decision", { method: "POST", body: JSON.stringify({ recommendation_id: inst.recommendation_id, decision: "accepted" }) }); refreshAll(false); }} aria-label="Accept instruction">Accept</button>
                    <button className="danger" onClick={async () => { await apiFetch("/api/driver/decision", { method: "POST", body: JSON.stringify({ recommendation_id: inst.recommendation_id, decision: "ignored" }) }); refreshAll(false); }} aria-label="Ignore instruction">Ignore</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
