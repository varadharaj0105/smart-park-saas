// ============================================
// Company Admin Dashboard
// ============================================

import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { ParkingSquare, CalendarCheck, CreditCard, Car, ArrowRight } from "lucide-react";

// Demo data — replace with API calls
const stats = {
  totalSlots: 120,
  availableSlots: 43,
  bookings: 77,
  revenue: "$4,230",
};

const recentBookings = [
  { id: "B001", vehicle: "ABC-1234", slot: "A-12", time: "10:00 AM", status: "Active" },
  { id: "B002", vehicle: "XYZ-5678", slot: "B-05", time: "11:30 AM", status: "Active" },
  { id: "B003", vehicle: "DEF-9012", slot: "C-08", time: "09:00 AM", status: "Completed" },
  { id: "B004", vehicle: "GHI-3456", slot: "A-03", time: "02:00 PM", status: "Active" },
];

export default function DashboardAdmin() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Slots" value={stats.totalSlots} icon={ParkingSquare} description="All parking slots" />
          <StatCard title="Available" value={stats.availableSlots} icon={Car} trend="up" trendValue="5 more today" />
          <StatCard title="Bookings" value={stats.bookings} icon={CalendarCheck} trend="up" trendValue="+12%" />
          <StatCard title="Revenue" value={stats.revenue} icon={CreditCard} trend="up" trendValue="+8% this month" />
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Manage Slots", path: "/slots", icon: ParkingSquare },
            { label: "View Bookings", path: "/booking", icon: CalendarCheck },
            { label: "Payments", path: "/payments", icon: CreditCard },
          ].map((a) => (
            <Link
              key={a.label}
              to={a.path}
              className="bg-card border border-border rounded-lg p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
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
                {recentBookings.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium text-foreground">{b.id}</td>
                    <td className="px-6 py-3 text-foreground">{b.vehicle}</td>
                    <td className="px-6 py-3 text-foreground">{b.slot}</td>
                    <td className="px-6 py-3 text-muted-foreground">{b.time}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          b.status === "Active"
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {b.status}
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
