import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { setToken } from "../lib/clientApi";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_API_BASE ?? ""}/api/v1/client/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Login failed");
      setToken(data.access_token);
      navigate("/client/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-view" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#101622" }}>
      <div className="login-card" style={{ maxWidth: 400, width: "100%", padding: 32, background: "#1a2332", borderRadius: 12, border: "1px solid #2a3342" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="logo-mark large" style={{ margin: "0 auto 12px", background: "#2563eb" }}>L</div>
          <h2 style={{ color: "#f4f7fb", margin: 0 }}>Logisight Partner Portal</h2>
          <p style={{ color: "#8b8d93", marginTop: 8 }}>Sign in to your operations dashboard</p>
        </div>
        {error && <div className="banner error" style={{ marginBottom: 16, padding: "8px 12px", borderRadius: 6, background: "#451a1a", color: "#fca5a5", fontSize: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", marginBottom: 4, fontSize: 14 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", background: "#111827", border: "1px solid #374151", borderRadius: 6, color: "#f4f7fb", fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#94a3b8", marginBottom: 4, fontSize: 14 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", background: "#111827", border: "1px solid #374151", borderRadius: 6, color: "#f4f7fb", fontSize: 14 }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 16, color: "#6b7280", fontSize: 14 }}>
          Don't have an account?{" "}
          <Link to="/client/register" style={{ color: "#60a5fa" }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
