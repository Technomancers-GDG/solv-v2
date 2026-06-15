import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { onAuthChange, signInWithGoogle, logout } from "../firebase";

const DashboardShell = lazy(() => import("../components/DashboardShell"));
const OnboardingWizard = lazy(() => import("./OnboardingWizard"));

function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top, #eef2f6, #f8fafc)", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontWeight: 500 }}>
      Loading...
    </div>
  );
}

export default function ClientPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseToken, setFirebaseToken] = useState(null);

  useEffect(() => {
    const unsub = onAuthChange(async (userOrNull) => {
      setUser(userOrNull);
      if (userOrNull) {
        try {
          const token = await userOrNull.getIdToken(true);
          setFirebaseToken(token);
          const resp = await fetch("/api/auth/client-status", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resp.ok) {
            const data = await resp.json();
            setStatus(data);
          } else {
            setStatus({ authenticated: false, has_fleet: false });
          }
        } catch {
          setStatus({ authenticated: false, has_fleet: false });
        }
      } else {
        setFirebaseToken(null);
        setStatus(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) return <Loading />;

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top, #eef2f6, #f8fafc)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ 
          textAlign: "center", 
          background: "rgba(255, 255, 255, 0.7)", 
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "48px 40px", 
          borderRadius: 28, 
          border: "1px solid rgba(0,0,0,0.04)", 
          boxShadow: "0 24px 64px rgba(0,0,0,0.08)",
          width: "100%",
          maxWidth: 420 
        }}>
          <div className="logo-mark large" style={{ margin: "0 auto 20px", background: "#111", color: "#eaf86b", width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.2rem", boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}>L</div>
          <h2 style={{ color: "#111", marginBottom: 8, fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Client Portal</h2>
          <p style={{ color: "#475569", marginBottom: 32, fontSize: "0.95rem", lineHeight: 1.5 }}>
            Sign in to access your logistics operations dashboard.
          </p>
          <button
            onClick={async () => {
              try {
                await signInWithGoogle();
              } catch (err) {
                console.error("Sign in failed:", err);
              }
            }}
            style={{ 
              width: "100%",
              padding: "14px 24px", 
              background: "#111", 
              color: "#fff", 
              border: "none", 
              borderRadius: 100, 
              fontSize: "0.95rem", 
              fontWeight: 600, 
              cursor: "pointer",
              transition: "transform 0.2s, background 0.2s",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = '#000'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#111'; }}
          >
            Sign in with Google
          </button>
          <p style={{ marginTop: 24, fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
            <a href="/" style={{ color: "#475569", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.color = '#111'} onMouseOut={(e) => e.currentTarget.style.color = '#475569'}>Back to home</a>
            <span style={{ margin: "0 12px", color: "#cbd5e1" }}>•</span>
            <a href="/dashboard" style={{ color: "#475569", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.color = '#111'} onMouseOut={(e) => e.currentTarget.style.color = '#475569'}>View Demo</a>
          </p>
        </div>
      </div>
    );
  }

  if (!status?.has_fleet) {
    return (
      <Suspense fallback={<Loading />}>
        <OnboardingWizard
          user={user}
          firebaseToken={firebaseToken}
          onComplete={() => {
            setStatus({ ...status, has_fleet: true });
          }}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <DashboardShell
        user={user}
        onLogout={handleLogout}
        clientContext={{
          clientId: status.client_id,
          companyName: status.company_name,
          firebaseToken,
        }}
      />
    </Suspense>
  );
}
