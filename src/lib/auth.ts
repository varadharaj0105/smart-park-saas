// ============================================
// Authentication Helper Functions
// Handles login, logout, session, and redirects
// ============================================

export type UserRole = "superadmin" | "admin" | "user";

export interface AuthUser {
  token: string;
  role: UserRole;
  tenant_id: string;
  user_id: string;
  name: string;
  email: string;
}

/**
 * Save user session to localStorage after login
 */
export function saveAuth(user: AuthUser) {
  localStorage.setItem("token", user.token);
  localStorage.setItem("role", user.role);
  localStorage.setItem("tenant_id", user.tenant_id);
  localStorage.setItem("user_id", user.user_id);
  localStorage.setItem("user_name", user.name);
  localStorage.setItem("user_email", user.email);
}

/**
 * Get current user from localStorage
 * Returns null if not logged in
 */
export function getAuth(): AuthUser | null {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") as UserRole | null;

  if (!token || !role) return null;

  return {
    token,
    role,
    tenant_id: localStorage.getItem("tenant_id") || "",
    user_id: localStorage.getItem("user_id") || "",
    name: localStorage.getItem("user_name") || "",
    email: localStorage.getItem("user_email") || "",
  };
}

/**
 * Check if user is logged in
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem("token");
}

/**
 * Clear session and log out
 */
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("tenant_id");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_email");
}

/**
 * Get the dashboard path for current user role
 */
export function getDashboardPath(role?: UserRole): string {
  const userRole = role || (localStorage.getItem("role") as UserRole);
  switch (userRole) {
    case "superadmin":
      return "/dashboard/superadmin";
    case "admin":
      return "/dashboard/admin";
    case "user":
      return "/dashboard/user";
    default:
      return "/login";
  }
}
