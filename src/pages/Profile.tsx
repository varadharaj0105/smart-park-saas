// ============================================
// Profile Page — View & Edit User Details
// ============================================

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useNotification } from "@/components/NotificationProvider";
import { getAuth, saveAuth } from "@/lib/auth";
import { User, Mail, Building2, Shield, Save } from "lucide-react";

export default function Profile() {
  const auth = getAuth();
  const [name, setName] = useState(auth?.name || "");
  const [email, setEmail] = useState(auth?.email || "");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleSave = () => {
    setLoading(true);
    // Simulate API call to update profile
    setTimeout(() => {
      if (auth) {
        saveAuth({ ...auth, name, email });
      }
      showNotification("Profile updated successfully!", "success");
      setLoading(false);
    }, 800);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h3 className="text-xl font-bold text-foreground">My Profile</h3>
          <p className="text-sm text-muted-foreground">View and edit your account details</p>
        </div>

        {/* Avatar section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground">{name}</h4>
              <p className="text-sm text-muted-foreground capitalize">{auth?.role} Account</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" /> Role
              </label>
              <input
                readOnly
                value={auth?.role || "user"}
                className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-foreground text-sm capitalize"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" /> Tenant ID
              </label>
              <input
                readOnly
                value={auth?.tenant_id || "N/A"}
                className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-foreground text-sm"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
