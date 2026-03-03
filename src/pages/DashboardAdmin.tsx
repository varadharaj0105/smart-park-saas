// ============================================
// Company Admin Dashboard — with Charts
// ============================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import PeakHourCard from "@/components/PeakHourCard";
import { ParkingSquare, CalendarCheck, CreditCard, Car, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { apiGetDashboardStats, apiGetBookings } from "@/lib/api";

export default function DashboardAdmin() {
  const [stats, setStats] = useState({
    totalSlots: 0,
    availableSlots: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGetDashboardStats().catch(() => ({ data: { totalSlots: 0, availableSlots: 0, totalBookings: 0, totalRevenue: 0 } })),
      apiGetBookings().catch(() => ({ data: [] }))
    ]).then(([statsRes, bookingsRes]) => {
      setStats(statsRes.data || statsRes);

      const ALL_BOOKINGS = bookingsRes.data || bookingsRes;
      if (Array.isArray(ALL_BOOKINGS)) {
        setRecentBookings(ALL_BOOKINGS.slice(0, 5));
      }
      setLoading(false);
    });
  }, []);
  // In case available slots somehow exceeds total slots
  const occupied = Math.max(0, stats.totalSlots - stats.availableSlots);
  const available = Math.max(0, stats.availableSlots);
  const slotUsage = [
    { name: "Available", value: available, color: "hsl(142, 71%, 45%)" },
    { name: "Occupied", value: occupied, color: "hsl(234, 80%, 60%)" },
  ];

  // Dummy revenue data just for visual aesthetics
  const revenueData = [
    { name: "Mon", revenue: 520 }, { name: "Tue", revenue: 680 },
    { name: "Wed", revenue: 590 }, { name: "Thu", revenue: 820 },
    { name: "Fri", revenue: 940 }, { name: "Sat", revenue: 450 },
    { name: "Sun", revenue: 330 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Slots" value={stats.totalSlots} icon={ParkingSquare} description="All parking slots" />
          <StatCard title="Available" value={stats.availableSlots} icon={Car} />
          <StatCard title="Total Bookings" value={stats.totalBookings} icon={CalendarCheck} />
          <StatCard title="Total Revenue" value={`$${Number(stats.totalRevenue).toFixed(2)}`} icon={CreditCard} />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold text-foreground mb-4">Weekly Revenue</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Slot Usage Pie */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold text-foreground mb-4">Slot Usage</h4>
            <ResponsiveContainer width="100%" height={250}>
              {stats.totalSlots > 0 ? (
                <PieChart>
                  <Pie data={slotUsage} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none" label={({ name, value }) => `${name} (${value})`}>
                    {slotUsage.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                </PieChart>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No slots created yet
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hour Prediction */}
        <PeakHourCard />

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Manage Slots", path: "/slots", icon: ParkingSquare },
            { label: "View Bookings", path: "/booking-history", icon: CalendarCheck },
            { label: "Payments", path: "/payments", icon: CreditCard },
          ].map((a) => (
            <Link
              key={a.label}
              to={a.path}
              className="bg-card border border-border rounded-lg p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
                <a.icon className="h-5 w-5" />
              </div>
              <span className="font-medium text-foreground flex-1">{a.label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>

        {/* Recent bookings table */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Recent Bookings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium">ID</th>
                  <th className="text-left px-6 py-3 font-medium">Vehicle</th>
                  <th className="text-left px-6 py-3 font-medium">Slot</th>
                  <th className="text-left px-6 py-3 font-medium">Time</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground text-sm">
                      No recent bookings found.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">{b.id}</td>
                      <td className="px-6 py-3 text-foreground">{b.vehicle_number}</td>
                      <td className="px-6 py-3 text-foreground">{b.slot_id}</td>
                      <td className="px-6 py-3 text-muted-foreground">{new Date(b.start_time).toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${b.status === "active" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground capitalize"}`}>
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
