import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { onAuthChange, signInWithGoogle, logout } from "../firebase";

const DashboardShell = lazy(() => import("../components/DashboardShell"));
const OnboardingWizard = lazy(() => import("./OnboardingWizard"));

function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "#101622", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b8d93" }}>
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
      <div style={{ minHeight: "100vh", background: "#101622", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", background: "#1a2332", padding: 40, borderRadius: 12, border: "1px solid #2a3342", maxWidth: 400 }}>
          <div className="logo-mark large" style={{ margin: "0 auto 12px", background: "#2563eb" }}>L</div>
          <h2 style={{ color: "#f4f7fb", marginBottom: 8 }}>Client Portal</h2>
          <p style={{ color: "#8b8d93", marginBottom: 24 }}>
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
            style={{ padding: "12px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Sign in with Google
          </button>
          <p style={{ marginTop: 16, fontSize: 13, color: "#6b7280" }}>
            <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>Back to home</a>
            <span style={{ margin: "0 8px", color: "#374151" }}>·</span>
            <a href="/dashboard" style={{ color: "#60a5fa", textDecoration: "none" }}>View Demo</a>
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
