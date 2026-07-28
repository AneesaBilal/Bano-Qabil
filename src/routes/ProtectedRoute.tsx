import { Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types";
import { signOut } from "@/api/auth.api";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role, profile } = useAuth();
  const location = useLocation();

  const isUnapproved =
    !!profile && profile.approval_status !== "approved" && (profile.role === "student" || profile.role === "teacher");

  useEffect(() => {
    if (isUnapproved) {
      signOut().catch(() => {});
    }
  }, [isUnapproved]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || isUnapproved) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <>{children}</>;
}
