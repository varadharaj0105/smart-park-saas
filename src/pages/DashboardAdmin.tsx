import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { ParkingSquare, CalendarCheck, CreditCard, Car, ArrowRight, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { apiGetDashboardStats, apiGetBookings } from "@/lib/api";

export default function DashboardAdmin() {
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("weekly");

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        apiGetDashboardStats(),
        apiGetBookings()
      ]);
      setStats(statsRes.data || statsRes);
      setRecentBookings((bookingsRes.data || bookingsRes).slice(0, 5));
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const occupied = Math.max(0, stats.totalSlots - stats.availableSlots);
  const available = Math.max(0, stats.availableSlots);
  const slotUsage = [
    { name: "Available", value: available, color: "hsl(142, 71%, 45%)" },
    { name: "Occupied", value: occupied, color: "hsl(234, 80%, 60%)" },
  ];

  // Get data for selected range
  const currentRangeData = stats[`${range}Revenue`];
  const chartData = currentRangeData?.chart || [];
  const rangeTotal = currentRangeData?.total || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
                <p className="text-muted-foreground">Monitor your parking location performance.</p>
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
          <StatCard title="Total Slots" value={stats.totalSlots} icon={ParkingSquare} description="All parking slots" />
          <StatCard title="Available Now" value={stats.availableSlots} icon={Car} />
          <StatCard title={`${range === 'daily' ? 'Today' : range === 'weekly' ? 'Weekly' : 'Monthly'} Revenue`} value={`₹${rangeTotal.toFixed(2)}`} icon={TrendingUp} />
          <StatCard title="Total Revenue" value={`₹${Number(stats.totalRevenue).toFixed(2)}`} icon={CreditCard} description="All-time earnings" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-lg">Revenue Trend</h4>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {range === 'daily' ? 'Hourly' : 'Daily'} Breakdown
                </span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {range === "monthly" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip
                        cursor={{fill: 'hsl(var(--muted))', opacity: 0.4}}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Slot Usage Pie */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h4 className="font-semibold text-lg mb-6">Slot Distribution</h4>
            <div className="relative h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={slotUsage} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none" paddingAngle={5}>
                            {slotUsage.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">{Math.round((occupied/stats.totalSlots)*100) || 0}%</span>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Occupied</span>
                </div>
            </div>
            <div className="mt-6 space-y-3">
                {slotUsage.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm font-medium text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold">{item.value}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Manage Slots", path: "/slots", icon: ParkingSquare, color: "bg-blue-500/10 text-blue-500" },
            { label: "View Bookings", path: "/booking-history", icon: CalendarCheck, color: "bg-purple-500/10 text-purple-500" },
            { label: "Payments", path: "/payments", icon: CreditCard, color: "bg-emerald-500/10 text-emerald-500" },
          ].map((a) => (
            <Link
              key={a.label}
              to={a.path}
              className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${a.color}`}>
                <a.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                  <span className="font-semibold text-foreground block">{a.label}</span>
                  <span className="text-xs text-muted-foreground">Access management tools</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>

        {/* Recent bookings table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Recent Bookings</h3>
            <Link to="/booking-history" className="text-xs font-semibold text-primary hover:underline">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">ID</th>
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Vehicle</th>
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Slot</th>
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Time</th>
                  <th className="text-left px-6 py-3 font-medium uppercase tracking-wider text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No recent bookings found.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">#{b.id}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{b.vehicle_number}</td>
                      <td className="px-6 py-4 text-foreground">{b.slot_id}</td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(b.start_time).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            b.status === "active" 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
