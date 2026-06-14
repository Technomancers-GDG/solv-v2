import { Suspense, lazy } from "react";
import { useLocation, Navigate } from "react-router-dom";
import ClientAuthGuard from "../components/client/ClientAuthGuard";

const ClientLogin = lazy(() => import("../pages/ClientLogin"));
const ClientRegister = lazy(() => import("../pages/ClientRegister"));
const ClientUploadWizard = lazy(() => import("../pages/ClientUploadWizard"));
const ClientDashboard = lazy(() => import("../pages/ClientDashboard"));

function Loading() {
  return <div className="loading" style={{ minHeight: "100vh", background: "#101622", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b8d93" }}>Loading...</div>;
}

export default function ClientPortal() {
  const path = useLocation().pathname;

  if (path === "/client") return <Navigate to="/client/login" replace />;

  if (path === "/client/login") {
    return <Suspense fallback={<Loading />}><ClientLogin /></Suspense>;
  }

  if (path === "/client/register") {
    return <Suspense fallback={<Loading />}><ClientRegister /></Suspense>;
  }

  if (path === "/client/upload") {
    return (
      <Suspense fallback={<Loading />}>
        <ClientAuthGuard><ClientUploadWizard /></ClientAuthGuard>
      </Suspense>
    );
  }

  if (path === "/client/dashboard") {
    return (
      <Suspense fallback={<Loading />}>
        <ClientAuthGuard><ClientDashboard /></ClientAuthGuard>
      </Suspense>
    );
  }

  return <Navigate to="/client/login" replace />;
}
