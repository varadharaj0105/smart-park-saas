import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { useNotification } from "@/components/NotificationProvider";
import { Building2, Users, CalendarCheck, CreditCard, Plus, X, Edit, Trash2, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import "leaflet/dist/leaflet.css";
import { 
  apiGetCompanies, 
  apiGetUsers, 
  apiCreateCompany, 
  apiUpdateCompany, 
  apiDeleteCompany,
  apiGetSuperDashboardStats
} from "@/lib/api";

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
      className="w-full h-[350px] rounded-xl border border-border overflow-hidden cursor-crosshair shadow-sm"
      style={{ background: "hsl(var(--muted))" }}
    />
  );
}

export default function DashboardSuperAdmin() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("monthly");

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
      const [compRes, usersRes, statsRes] = await Promise.all([
        apiGetCompanies(),
        apiGetUsers(),
        apiGetSuperDashboardStats(),
      ]);
      setTenants(compRes.data || compRes);
      setAllUsers(usersRes.data || usersRes);
      setStats(statsRes.data || statsRes);
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
      admin_password: "", 
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

  if (loading || !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const currentChartData = stats[`${range}Revenue`]?.chart || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Platform Overview</h2>
                <p className="text-muted-foreground">Manage and monitor all parking locations globally.</p>
            </div>
            <div className="flex bg-muted p-1 rounded-lg self-start">
                {(["daily", "weekly", "monthly"] as const).map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                            range === r 
                            ? "bg-background text-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {r === "daily" ? "Today" : r === "weekly" ? "7 Days" : "30 Days"}
                    </button>
                ))}
            </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Companies" value={stats.totalCompanies} icon={Building2} />
          <StatCard title="Total Customers" value={stats.totalUsers} icon={Users} />
          <StatCard title="Total Bookings" value={stats.totalBookings} icon={CalendarCheck} />
          <StatCard title="Platform Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={CreditCard} />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Trend Over Time */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <h4 className="font-semibold text-lg">Platform Revenue Trend</h4>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={currentChartData}>
                  <defs>
                    <linearGradient id="colorRevTarget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRevTarget)" />
                </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Company Revenue Comparison */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h4 className="font-semibold text-lg mb-6">Top Performing Companies</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.companyComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--foreground))", fontWeight: "bold" }} width={80} />
                <Tooltip cursor={{fill: 'hsl(var(--muted))', opacity: 0.2}} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Map & List */}
        <div className="grid lg:grid-cols-1 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-lg">Location Management</h4>
                <p className="text-sm text-muted-foreground">Click the map to add a new company, or edit from the list below.</p>
              </div>
            </div>
            <div className="flex-1 min-h-[350px] relative rounded-xl overflow-hidden border border-border">
              <SuperMapComponent locations={tenants} onMapClick={handleMapClick} />
            </div>
          </div>
        </div>

        {/* Tenants list */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/20">
            <h3 className="font-semibold text-foreground">Registered Companies (Tenants)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Company</th>
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Users</th>
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Joined</th>
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((t) => {
                  const userCount = allUsers.filter(u => u.tenant_id === t.id).length;
                  return (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">{t.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{userCount} Users</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEditClick(t)} className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-all" title="Edit Company"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteClick(t.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-all" title="Delete Company"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* All users list */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Cloud Platform Users</h3>
              <p className="text-xs text-muted-foreground">Comprehensive list of all platform accounts.</p>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded">
              Total: {allUsers.length}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Name</th>
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Email</th>
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Role</th>
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Tenant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allUsers.map((u) => {
                  const tenant = tenants.find((t) => t.id === u.tenant_id);
                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground">{u.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === "super_admin"
                            ? "bg-primary/10 text-primary"
                            : u.role === "company_admin"
                              ? "bg-accent text-accent-foreground shadow-sm"
                              : "bg-secondary text-secondary-foreground"
                            }`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                        {tenant ? tenant.name : "Platform"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in text-left">
            <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-foreground text-xl">
                  {editMode ? "Edit Parking Company" : "Register New Company"}
                </h3>
                <button onClick={() => setShowModal(false)} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Latitude</label>
                    <input disabled value={form.latitude} className="w-full h-11 px-4 rounded-xl border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Longitude</label>
                    <input disabled value={form.longitude} className="w-full h-11 px-4 rounded-xl border border-input bg-muted text-muted-foreground text-sm cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Full Business Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={form.company_name}
                      onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                      placeholder="e.g. Nexus Mall Parking"
                      className="w-full h-11 pl-12 pr-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-4">
                   <div className="flex items-center gap-2 mb-4">
                        <Users className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-sm">Assign Head Administrator</h4>
                   </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Admin Full Name</label>
                      <input
                        value={form.admin_name}
                        onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Work Email</label>
                      <input
                        type="email"
                        value={form.admin_email}
                        onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                        placeholder="admin@nexus.com"
                        className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Temporary Access Password</label>
                      <input
                        type="password"
                        value={form.admin_password}
                        onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || !form.company_name || !form.admin_email || (!editMode && !form.admin_password)}
                  className="w-full h-12 mt-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:translate-y-[-2px] hover:shadow-lg active:translate-y-0 transition-all disabled:opacity-50"
                >
                  {saving ? "Processing..." : editMode ? "Update Company Assets" : "Initialize Company & Admin"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
