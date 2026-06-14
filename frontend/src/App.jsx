import { useState, useEffect, lazy, Suspense } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { onAuthChange, logout } from "./firebase";
import { LandingView } from "./components/landing/LandingView";

const DashboardShell = lazy(() => import("./components/DashboardShell"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [firebaseToken, setFirebaseToken] = useState(null);
  const [clientContext, setClientContext] = useState(null);
  const [hasFleet, setHasFleet] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => { setAuthReady(true); }, []);

  useEffect(() => {
    const unsub = onAuthChange(async (userOrNull) => {
      setUser(userOrNull);
      if (userOrNull) {
        try {
          const token = await userOrNull.getIdToken(true);
          setFirebaseToken(token);
          setStatusLoading(true);
          console.log("[RC5-DIAG] Auth resolved: user=", userOrNull.email, "checking client-status...");
          const resp = await fetch(`/api/auth/client-status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const status = await resp.json();
          console.log("[RC5-DIAG] client-status response:", status);
          if (status.has_fleet) {
            setHasFleet(true);
            setClientContext({ clientId: status.client_id, companyName: status.company_name, firebaseToken: token });
            console.log("[RC5-DIAG] clientContext SET: clientId=", status.client_id, "company=", status.company_name);
          } else {
            setHasFleet(false);
            setClientContext(null);
            console.log("[RC5-DIAG] clientContext null: has_fleet=false");
          }
        } catch (err) {
          console.log("[RC5-DIAG] client-status FAILED:", err);
          setHasFleet(false);
          setClientContext(null);
        } finally {
          setStatusLoading(false);
          setAuthResolved(true);
        }
      } else {
        console.log("[RC5-DIAG] Auth resolved: no user (signed out)");
        setFirebaseToken(null);
        setClientContext(null);
        setHasFleet(false);
        setAuthResolved(true);
      }
    });
    return unsub;
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setFirebaseToken(null);
    setClientContext(null);
    navigate("/");
  };

  // Landing page
  if (location.pathname === "/") {
    return <LandingView />;
  }

  // Client portal (login + onboarding + client dashboard)
  if (location.pathname.startsWith("/client")) {
    return (
      <Suspense fallback={<div className="loading">Loading...</div>}>
        <ClientPortal />
      </Suspense>
    );
  }

  // Dashboard - waits for auth resolution to prevent demo endpoint calls
  // before clientContext is determined. Unauthenticated users get demo mode;
  // authenticated clients with fleet data get client mode.
  if (location.pathname === "/dashboard") {
    if (!authReady || !authResolved || statusLoading) return <div className="loading">Loading...</div>;
    return (
      <Suspense fallback={<div className="loading">Loading...</div>}>
        <DashboardShell
          user={user}
          onLogout={handleLogout}
          clientContext={clientContext}
        />
      </Suspense>
    );
  }

  // Login redirects to landing
  if (location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  // Catch-all
  return <Navigate to="/" replace />;
}
