// ============================================
// Super Admin Dashboard
// ============================================

import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Building2, Users, CalendarCheck, CreditCard } from "lucide-react";

const stats = {
  companies: 8,
  users: 256,
  bookings: 1420,
  revenue: "$32,800",
};

const tenants = [
  { id: "T1", name: "Downtown Parking Co.", users: 45, slots: 120, revenue: "$8,200", status: "Active" },
  { id: "T2", name: "Airport Parking Ltd.", users: 78, slots: 200, revenue: "$12,400", status: "Active" },
  { id: "T3", name: "Mall Parking Services", users: 32, slots: 80, revenue: "$4,100", status: "Active" },
  { id: "T4", name: "University Parking", users: 56, slots: 150, revenue: "$5,600", status: "Inactive" },
  { id: "T5", name: "Hotel Grand Parking", users: 45, slots: 60, revenue: "$2,500", status: "Active" },
];

export default function DashboardSuperAdmin() {
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
                  <th className="text-left px-6 py-3 font-medium">Revenue</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium text-foreground">{t.name}</td>
                    <td className="px-6 py-3 text-foreground">{t.users}</td>
                    <td className="px-6 py-3 text-foreground">{t.slots}</td>
                    <td className="px-6 py-3 text-foreground">{t.revenue}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.status === "Active"
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
