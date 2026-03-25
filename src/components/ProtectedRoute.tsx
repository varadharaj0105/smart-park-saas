import { Navigate, useLocation } from "react-router-dom";
import { getAuth } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const auth = getAuth();
  const location = useLocation();

  if (!auth) {
    // Not logged in -> redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    // Logged in but wrong role -> redirect to appropriate dashboard
    return <Navigate to={`/dashboard/${auth.role}`} replace />;
  }

  return <>{children}</>;
}
