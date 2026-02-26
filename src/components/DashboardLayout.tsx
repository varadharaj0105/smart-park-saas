// ============================================
// Dashboard Layout with Sidebar and Navbar
// Wraps all dashboard pages
// ============================================

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, logout, type UserRole } from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import LogoutModal from "@/components/LogoutModal";
import {
  LayoutDashboard,
  ParkingSquare,
  CalendarCheck,
  CreditCard,
  Building2,
  Users,
  LogOut,
  Menu,
  X,
  Car,
  Map,
  History,
  UserCircle,
  Sun,
  Moon,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navByRole: Record<UserRole, NavItem[]> = {
  superadmin: [
    { label: "Dashboard", path: "/dashboard/superadmin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Companies", path: "/dashboard/superadmin", icon: <Building2 className="h-5 w-5" /> },
    { label: "Users", path: "/dashboard/superadmin", icon: <Users className="h-5 w-5" /> },
    { label: "Payments", path: "/payments", icon: <CreditCard className="h-5 w-5" /> },
  ],
  admin: [
    { label: "Dashboard", path: "/dashboard/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Manage Slots", path: "/slots", icon: <ParkingSquare className="h-5 w-5" /> },
    { label: "Bookings", path: "/booking", icon: <CalendarCheck className="h-5 w-5" /> },
    { label: "Parking Map", path: "/map", icon: <Map className="h-5 w-5" /> },
    { label: "Payments", path: "/payments", icon: <CreditCard className="h-5 w-5" /> },
  ],
  user: [
    { label: "Dashboard", path: "/dashboard/user", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Book Slot", path: "/booking", icon: <CalendarCheck className="h-5 w-5" /> },
    { label: "Parking Map", path: "/map", icon: <Map className="h-5 w-5" /> },
    { label: "My Bookings", path: "/booking-history", icon: <History className="h-5 w-5" /> },
    { label: "Payments", path: "/payments", icon: <CreditCard className="h-5 w-5" /> },
    { label: "Profile", path: "/profile", icon: <UserCircle className="h-5 w-5" /> },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const role = auth?.role || "user";
  const items = navByRole[role];
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground">SmartPark</h1>
            <p className="text-xs text-muted-foreground capitalize">{role} Panel</p>
          </div>
          <button
            className="ml-auto lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle + User info + logout */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              {auth?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{auth?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{auth?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={() => setLogoutOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
          <button
            className="lg:hidden text-muted-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            {items.find((i) => i.path === location.pathname)?.label || "Dashboard"}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Logout confirmation modal */}
      <LogoutModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}
