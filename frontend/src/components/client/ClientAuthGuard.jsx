import { Navigate } from "react-router-dom";
import { getToken } from "../../lib/clientApi";

export default function ClientAuthGuard({ children }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/client/login" replace />;
  }
  return children;
}
