// ============================================
// User Dashboard
// ============================================

import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { CalendarCheck, CreditCard, ParkingSquare, Building2, ArrowRight } from "lucide-react";

const demoCompanies = [
  { id: "1", name: "Downtown Parking Co." },
  { id: "2", name: "Airport Parking Ltd." },
  { id: "3", name: "Mall Parking Services" },
];

const myBookings = [
  { id: "B010", company: "Downtown Parking Co.", slot: "A-05", date: "2026-02-24", status: "Active" },
  { id: "B008", company: "Airport Parking Ltd.", slot: "C-12", date: "2026-02-22", status: "Completed" },
  { id: "B006", company: "Downtown Parking Co.", slot: "B-03", date: "2026-02-20", status: "Completed" },
];

export default function DashboardUser() {
  const [selectedCompany, setSelectedCompany] = useState("");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="My Bookings" value={3} icon={CalendarCheck} />
          <StatCard title="Active" value={1} icon={ParkingSquare} />
          <StatCard title="Total Spent" value="$85" icon={CreditCard} />
          <StatCard title="Companies" value={demoCompanies.length} icon={Building2} />
        </div>

        {/* Select company */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Select Company to Book</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Choose a company...</option>
              {demoCompanies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 px-5 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              View Slots <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            to="/booking"
            className="bg-card border border-border rounded-lg p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
          >
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <span className="font-medium text-foreground flex-1">Book a Slot</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
          <Link
            to="/payments"
            className="bg-card border border-border rounded-lg p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
          >
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="font-medium text-foreground flex-1">Payment History</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>

        {/* My bookings */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">My Bookings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium">ID</th>
                  <th className="text-left px-6 py-3 font-medium">Company</th>
                  <th className="text-left px-6 py-3 font-medium">Slot</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium text-foreground">{b.id}</td>
                    <td className="px-6 py-3 text-foreground">{b.company}</td>
                    <td className="px-6 py-3 text-foreground">{b.slot}</td>
                    <td className="px-6 py-3 text-muted-foreground">{b.date}</td>
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
