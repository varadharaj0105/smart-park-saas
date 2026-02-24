// ============================================
// Login Page
// ============================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, Eye, EyeOff } from "lucide-react";
import { apiLogin } from "@/lib/api";
import { saveAuth, getDashboardPath } from "@/lib/auth";
import { useNotification } from "@/components/NotificationProvider";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showNotification("Please fill in all fields", "warning");
      return;
    }

    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      saveAuth(data);
      showNotification("Login successful!", "success");
      navigate(getDashboardPath(data.role));
    } catch (err: any) {
      showNotification(err.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Demo login for testing without backend
  const demoLogin = (role: "superadmin" | "admin" | "user") => {
    saveAuth({
      token: "demo-token",
      role,
      tenant_id: "tenant-1",
      user_id: "user-1",
      name: role === "superadmin" ? "Super Admin" : role === "admin" ? "Company Admin" : "John User",
      email: `${role}@demo.com`,
    });
    showNotification(`Logged in as ${role}`, "success");
    navigate(getDashboardPath(role));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">SmartPark</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo buttons */}
        <div className="mt-6 bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground text-center mb-3">Demo Login (no backend needed)</p>
          <div className="grid grid-cols-3 gap-2">
            {(["superadmin", "admin", "user"] as const).map((role) => (
              <button
                key={role}
                onClick={() => demoLogin(role)}
                className="px-3 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors capitalize"
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
