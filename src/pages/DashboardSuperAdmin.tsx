// ============================================
// Super Admin Dashboard — with Charts
// ============================================

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { useNotification } from "@/components/NotificationProvider";
import { Building2, Users, CalendarCheck, CreditCard, Plus, X, Edit, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "leaflet/dist/leaflet.css";
import { apiGetCompanies, apiGetUsers, apiCreateCompany, apiUpdateCompany, apiDeleteCompany, apiGetSuperPayments } from "@/lib/api";



function SuperMapComponent({
  locations,
  onMapClick,
}: {
  locations: any[];
  onMapClick: (lat: number, lng: number) => void;
}) {
  useEffect(() => {
    import("leaflet").then((L) => {
      const existing = document.getElementById("super-parking-map");
      if (!existing) return;

      if ((existing as any)._leaflet_id) {
        (existing as any)._leaflet_id = null;
        existing.innerHTML = "";
      }

      const map = L.map("super-parking-map").setView([28.6139, 77.209], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background:hsl(234,80%,60%);color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">P</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (locations && locations.length > 0) {
        const validLocs = locations.filter((l) => l.latitude && l.longitude);
        if (validLocs.length > 0) {
          const bounds = L.latLngBounds(validLocs.map(l => [l.latitude, l.longitude] as [number, number]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      }

      locations?.forEach((loc) => {
        if (!loc.latitude || !loc.longitude) return;
        const marker = L.marker([loc.latitude, loc.longitude], { icon }).addTo(map);
        marker.bindPopup(`<strong>${loc.name}</strong>`);
      });

      map.on("click", (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });

      return () => map.remove();
    });
  }, [locations, onMapClick]);

  return (
    <div
      id="super-parking-map"
      className="w-full h-[400px] rounded-lg border border-border overflow-hidden cursor-crosshair"
      style={{ background: "hsl(var(--muted))" }}
    />
  );
}

export default function DashboardSuperAdmin() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const [form, setForm] = useState({
    company_name: "",
    latitude: "",
    longitude: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
  });

  const loadData = async () => {
    try {
      const [compRes, usersRes, paymentsRes] = await Promise.all([
        apiGetCompanies(),
        apiGetUsers(),
        apiGetSuperPayments(),
      ]);
      setTenants(compRes.data || compRes);
      setAllUsers(usersRes.data || usersRes);
      setPayments(paymentsRes.data || paymentsRes || []);
    } catch (e: any) {
      showNotification(e.message || "Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setForm(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
    setEditMode(false);
    setSelectedCompanyId(null);
    setShowModal(true);
  }, []);

  const handleEditClick = (tenant: any) => {
    const admin = allUsers.find(u => u.tenant_id === tenant.id && u.role === "company_admin");
    setForm({
      company_name: tenant.name,
      latitude: tenant.latitude || "",
      longitude: tenant.longitude || "",
      admin_name: admin ? admin.name : "",
      admin_email: admin ? admin.email : "",
      admin_password: "", // Left blank so it doesn't get updated unless typed
    });
    setEditMode(true);
    setSelectedCompanyId(tenant.id);
    setShowModal(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this company and all its data?")) return;
    try {
      await apiDeleteCompany(id);
      showNotification("Company deleted successfully.", "success");
      await loadData();
    } catch (e: any) {
      showNotification(e.message || "Failed to delete company", "error");
    }
  };

  const handleSave = async () => {
    if (!form.company_name || !form.admin_email) {
      showNotification("Company name and admin email are required.", "warning");
      return;
    }
    if (!editMode && !form.admin_password) {
      showNotification("Admin password is required for new companies.", "warning");
      return;
    }
    setSaving(true);
    try {
      if (editMode && selectedCompanyId) {
        await apiUpdateCompany(selectedCompanyId, {
          company_name: form.company_name,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          admin_name: form.admin_name,
          admin_email: form.admin_email,
          admin_password: form.admin_password || undefined,
        });
        showNotification("Company updated successfully!", "success");
      } else {
        await apiCreateCompany({
          company_name: form.company_name,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          admin_name: form.admin_name,
          admin_email: form.admin_email,
          admin_password: form.admin_password,
        });
        showNotification("Company and admin created successfully!", "success");
      }
      setShowModal(false);
      setForm({ company_name: "", latitude: "", longitude: "", admin_name: "", admin_email: "", admin_password: "" });
      await loadData();
    } catch (e: any) {
      showNotification(e.message || "Failed to save company", "error");
    } finally {
      setSaving(false);
    }
  };

  // Real revenue per company from payments
  const companyRevenue = tenants.slice(0, 6).map(t => {
    const rev = payments
      .filter((p: any) => p.tenant_id === t.id)
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    return { name: t.name.split(" ")[0], revenue: rev };
  });

  // Real aggregated stats
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalBookings = payments.length; // each payment = 1 completed booking

  const stats = {
    companies: tenants.length,
    users: allUsers.length,
    bookings: totalBookings,
    revenue: `$${totalRevenue.toFixed(2)}`,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Companies" value={stats.companies} icon={Building2} trend="up" trendValue="+2 this month" />
          <StatCard title="Total Users" value={stats.users} icon={Users} trend="up" trendValue="+18%" />
          <StatCard title="Total Bookings" value={stats.bookings} icon={CalendarCheck} trend="up" trendValue="+24%" />
          <StatCard title="Total Revenue" value={stats.revenue} icon={CreditCard} trend="up" trendValue="+15%" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Company Revenue Comparison */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold text-foreground mb-4">Company Revenue Comparison</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={companyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Map */}
          <div className="bg-card border border-border rounded-lg p-6 flex flex-col">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Create Area via Map</h4>
              <p className="text-sm text-muted-foreground mb-4">Click anywhere on the map to create a new company location and assign an admin.</p>
            </div>
            <div className="flex-1 min-h-[250px] relative rounded-lg overflow-hidden border border-border">
              <SuperMapComponent locations={tenants} onMapClick={handleMapClick} />
            </div>
          </div>
        </div>

        {/* Tenants list */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Registered Companies (Tenants)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium">Company</th>
                  <th className="text-left px-6 py-3 font-medium">Users</th>
                  <th className="text-left px-6 py-3 font-medium">Slots</th>
                  <th className="text-left px-6 py-3 font-medium">Joined</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-left px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => {
                  const userCount = allUsers.filter(u => u.tenant_id === t.id).length;
                  return (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">{t.name}</td>
                      <td className="px-6 py-3 text-foreground">{userCount} Users</td>
                      <td className="px-6 py-3 text-muted-foreground">{t.latitude ? "Map Synced" : "No Loc"}</td>
                      <td className="px-6 py-3 text-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEditClick(t)} className="p-1.5 bg-accent text-accent-foreground rounded-lg hover:opacity-80 transition-opacity" title="Edit Company"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteClick(t.id)} className="p-1.5 bg-destructive/10 text-destructive rounded-lg hover:opacity-80 transition-opacity" title="Delete Company"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* All users list (including customers) */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">All Users</h3>
              <p className="text-xs text-muted-foreground">
                Includes super admins, company admins, and customers.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Total: <span className="font-medium text-foreground">{allUsers.length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium">Name</th>
                  <th className="text-left px-6 py-3 font-medium">Email</th>
                  <th className="text-left px-6 py-3 font-medium">Role</th>
                  <th className="text-left px-6 py-3 font-medium">Tenant</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u) => {
                  const tenant = tenants.find((t) => t.id === u.tenant_id);
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-3 font-medium text-foreground">{u.name}</td>
                      <td className="px-6 py-3 text-foreground">{u.email}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "super_admin"
                            ? "bg-primary/10 text-primary"
                            : u.role === "company_admin"
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-secondary-foreground"
                            }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-foreground">
                        {tenant ? tenant.name : `Tenant #${u.tenant_id}`}
                      </td>
                    </tr>
                  );
                })}
                {allUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      No users found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-lg">
                  {editMode ? "Edit Parking Area" : "Create New Parking Area"}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Latitude</label>
                    <input disabled value={form.latitude} className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-muted-foreground text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Longitude</label>
                    <input disabled value={form.longitude} className="w-full h-10 px-3 rounded-lg border border-input bg-muted text-muted-foreground text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Company / Property Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      placeholder="e.g. Nexus Mall Parking"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border mt-2">
                  <h4 className="font-semibold text-sm mb-3">Assign Company Admin</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Admin Full Name</label>
                      <input
                        value={form.admin_name}
                        onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Admin Email</label>
                      <input
                        type="email"
                        value={form.admin_email}
                        onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                        placeholder="admin@nexus.com"
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Temp Password</label>
                      <input
                        type="password"
                        value={form.admin_password}
                        onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || !form.company_name || !form.admin_email || (!editMode && !form.admin_password)}
                  className="w-full h-10 mt-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Saving..." : editMode ? "Save Changes" : "Create Company & Admin"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
