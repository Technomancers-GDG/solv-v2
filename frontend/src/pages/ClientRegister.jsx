import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { setToken } from "../lib/clientApi";

export default function ClientRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ company_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_API_BASE ?? ""}/api/v1/client/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Registration failed");
      setToken(data.access_token);
      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-view" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#101622" }}>
        <div className="login-card" style={{ maxWidth: 480, width: "100%", padding: 32, background: "#1a2332", borderRadius: 12, border: "1px solid #2a3342" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 48 }}>&#9989;</span>
            <h2 style={{ color: "#f4f7fb" }}>Account Created!</h2>
            <p style={{ color: "#8b8d93" }}>
              Welcome, {success.company_name}. Your operations dashboard is ready.
            </p>
            <div style={{ background: "#065f46", borderRadius: 8, padding: 16, margin: "16px 0", wordBreak: "break-all" }}>
              <p style={{ color: "#6ee7b7", fontSize: 13, margin: "0 0 4px" }}>Your API Key (save it now — it won't be shown again):</p>
              <code style={{ color: "#f4f7fb", fontSize: 14, display: "block", marginBottom: 8 }}>{success.api_key}</code>
              <button onClick={() => { navigator.clipboard.writeText(success.api_key); }}
                style={{ padding: "6px 12px", background: "#059669", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>
                Copy Key
              </button>
            </div>
            <button onClick={() => navigate("/client/upload")}
              style={{ width: "100%", padding: 12, background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
              Continue to Upload Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-view" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#101622" }}>
      <div className="login-card" style={{ maxWidth: 400, width: "100%", padding: 32, background: "#1a2332", borderRadius: 12, border: "1px solid #2a3342" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="logo-mark large" style={{ margin: "0 auto 12px", background: "#2563eb" }}>L</div>
          <h2 style={{ color: "#f4f7fb", margin: 0 }}>Partner Integration</h2>
          <p style={{ color: "#8b8d93", marginTop: 8 }}>Get API access and start managing your fleet</p>
        </div>
        {error && <div className="banner error" style={{ marginBottom: 16, padding: "8px 12px", borderRadius: 6, background: "#451a1a", color: "#fca5a5", fontSize: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#94a3b8", marginBottom: 4, fontSize: 14 }}>Company Name *</label>
            <input type="text" value={form.company_name} onChange={handleChange("company_name")} required
              style={{ width: "100%", padding: "10px 12px", background: "#111827", border: "1px solid #374151", borderRadius: 6, color: "#f4f7fb", fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: "#94a3b8", marginBottom: 4, fontSize: 14 }}>Email *</label>
            <input type="email" value={form.email} onChange={handleChange("email")} required
              style={{ width: "100%", padding: "10px 12px", background: "#111827", border: "1px solid #374151", borderRadius: 6, color: "#f4f7fb", fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#94a3b8", marginBottom: 4, fontSize: 14 }}>Password * (min 8 characters)</label>
            <input type="password" value={form.password} onChange={handleChange("password")} required minLength={8}
              style={{ width: "100%", padding: "10px 12px", background: "#111827", border: "1px solid #374151", borderRadius: 6, color: "#f4f7fb", fontSize: 14 }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            {loading ? "Creating Account..." : "Get API Access & Start"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 16, color: "#6b7280", fontSize: 14 }}>
          Already registered?{" "}
          <Link to="/client/login" style={{ color: "#60a5fa" }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
