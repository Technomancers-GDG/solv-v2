import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clientApi } from "../lib/clientApi";

const TEMPLATES = {
  facilities: { label: "Facilities", icon: "\ud83d\udce6", template: "/api/v1/client/templates/facilities.csv", endpoint: "/api/v1/client/upload/facilities", fields: "name,city,facility_type,latitude,longitude,base_capacity_units" },
  vehicles: { label: "Vehicles", icon: "\ud83d\ude9b", template: "/api/v1/client/templates/vehicles.csv", endpoint: "/api/v1/client/upload/vehicles", fields: "identifier,vehicle_type,payload_capacity_units,home_facility_name,average_speed_kmph" },
  drivers: { label: "Drivers", icon: "\ud83d\udc64", template: "/api/v1/client/templates/drivers.csv", endpoint: "/api/v1/client/upload/drivers", fields: "name,active" },
  objectives: { label: "Objectives", icon: "\ud83d\udccb", template: "/api/v1/client/templates/objectives.csv", endpoint: "/api/v1/client/upload/objectives", fields: "name,commodity,origin_facility_name,destination_facility_name,dispatch_interval_minutes,sla_minutes,priority" },
};

const ORDER = ["facilities", "vehicles", "drivers", "objectives"];

function UploadTile({ category, config, onComplete, completed }) {
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setImporting(true);
    setError("");
    try {
      const resp = await clientApi.post(config.endpoint, csvText.trim(), { "Content-Type": "text/csv" });
      setResult(resp);
      if (resp.success) onComplete(category);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ background: "#1a2332", border: completed ? "2px solid #059669" : "1px solid #2a3342", borderRadius: 12, padding: 20, transition: "border 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{config.icon}</span>
        <div>
          <h3 style={{ color: "#f4f7fb", margin: 0, fontSize: 16 }}>{config.label}</h3>
          <a href={config.template} download style={{ color: "#60a5fa", fontSize: 12 }}>Download template</a>
        </div>
        {completed && <span style={{ marginLeft: "auto", color: "#10b981", fontSize: 20 }}>&#10003;</span>}
      </div>
      {!completed ? (
        <>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={`Paste CSV data here, or use the template:\n${config.fields}`}
            rows={5}
            style={{ width: "100%", padding: 10, background: "#111827", border: "1px solid #374151", borderRadius: 6, color: "#f4f7fb", fontSize: 12, fontFamily: "monospace", resize: "vertical" }}
          />
          <button onClick={handleImport} disabled={importing || !csvText.trim()}
            style={{ marginTop: 10, padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
            {importing ? "Importing..." : "Import"}
          </button>
          {error && <div style={{ marginTop: 8, color: "#fca5a5", fontSize: 12 }}>{error}</div>}
          {result && (
            <div style={{ marginTop: 8, fontSize: 12, color: result.success ? "#6ee7b7" : "#fca5a5" }}>
              {result.imported} imported. {result.errors?.length || 0} errors.
            </div>
          )}
        </>
      ) : (
        <div style={{ color: "#6ee7b7", fontSize: 14 }}>Upload complete</div>
      )}
    </div>
  );
}

export default function ClientUploadWizard() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState({});
  const [allDone, setAllDone] = useState(false);
  const [status, setStatus] = useState(null);

  const handleComplete = (category) => {
    setCompleted(c => ({ ...c, [category]: true }));
  };

  useEffect(() => {
    clientApi.get("/api/v1/client/upload-status").then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (status?.all_complete || ORDER.every(k => completed[k])) {
      setAllDone(true);
    }
  }, [completed, status]);

  const doneCount = ORDER.filter(k => completed[k]).length;

  return (
    <div style={{ minHeight: "100vh", background: "#101622", padding: 40 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="logo-mark large" style={{ margin: "0 auto 12px", background: "#2563eb" }}>L</div>
          <h2 style={{ color: "#f4f7fb", margin: 0 }}>Upload Your Fleet Data</h2>
          <p style={{ color: "#8b8d93", marginTop: 8 }}>Upload all 4 categories to activate your operations</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24, justifyContent: "center" }}>
          {ORDER.map((k, i) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: completed[k] ? "#10b981" : "#6b7280", fontSize: 13 }}>
                {completed[k] ? "\u2713" : "\u2014"} {TEMPLATES[k].label}
              </span>
              {i < 3 && <span style={{ color: "#374151" }}>&#8594;</span>}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {ORDER.map(category => (
            <UploadTile key={category} category={category} config={TEMPLATES[category]} onComplete={handleComplete} completed={!!completed[category]} />
          ))}
        </div>

        {allDone && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <div style={{ background: "#065f46", borderRadius: 12, padding: 24 }}>
              <span style={{ fontSize: 36 }}>&#127881;</span>
              <h3 style={{ color: "#6ee7b7", margin: "8px 0" }}>Your operations are now live!</h3>
              <button onClick={() => navigate("/client/dashboard")}
                style={{ padding: "12px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
