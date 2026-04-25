import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginView() {
  const { login, authEnabled } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (!authEnabled) {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <div className="logo-mark large">SOLV</div>
          <h2>Authentication Not Configured</h2>
          <p className="muted">
            Firebase auth environment variables are missing. Set
            VITE_FIREBASE_API_KEY and VITE_FIREBASE_AUTH_DOMAIN to enable
            login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="logo-mark large">SOLV</div>
        <h2>Admin Portal</h2>
        <p className="muted">Sign in to access the command center</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field full">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="field full">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="banner error">{error}</div>}
          <button type="submit" disabled={loading} className="primary full">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
