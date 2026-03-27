// ============================================
// Signup Page — Customer registration only
// ============================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { apiSignup, apiGoogleLogin } from "@/lib/api";
import { useNotification } from "@/components/NotificationProvider";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const res = await apiGoogleLogin(credentialResponse.credential);
      if (res.success) {
        showNotification("Account created and logged in via Google!", "success");
        // Redirect based on role
        navigate(`/dashboard/${res.role || "user"}`);
      }
    } catch (err: any) {
      showNotification(err.message || "Google signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      showNotification("Please fill in all required fields", "warning");
      return;
    }
    setLoading(true);
    try {
      await apiSignup({ ...form, role: "user" });
      showNotification("Account created! Please login.", "success");
      navigate("/login");
    } catch (err: any) {
      showNotification(err.message || "Signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">SmartPark</span>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm text-left">
          <h2 className="text-2xl font-bold text-foreground mb-1">Create account</h2>
          <p className="text-sm text-muted-foreground mb-6">Register to start booking parking slots</p>

          <div className="w-full flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => showNotification("Google Login Failed", "error")}
              useOneTap
              theme="outline"
              size="large"
              width="320"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="John Doe"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
