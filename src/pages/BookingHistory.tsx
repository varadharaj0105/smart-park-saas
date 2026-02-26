// ============================================
// Booking History Page
// ============================================

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, Filter, CalendarCheck } from "lucide-react";

const demoHistory = [
  { id: "B001", vehicle: "ABC-1234", slot: "A-12", company: "Downtown Parking Co.", date: "2026-02-24", duration: "3h", cost: "$15.00", status: "Active" },
  { id: "B002", vehicle: "XYZ-5678", slot: "B-05", company: "Airport Parking Ltd.", date: "2026-02-23", duration: "2h", cost: "$10.00", status: "Completed" },
  { id: "B003", vehicle: "DEF-9012", slot: "C-08", company: "Downtown Parking Co.", date: "2026-02-22", duration: "5h", cost: "$25.00", status: "Completed" },
  { id: "B004", vehicle: "GHI-3456", slot: "A-03", company: "Mall Parking Services", date: "2026-02-21", duration: "1h", cost: "$5.00", status: "Cancelled" },
  { id: "B005", vehicle: "JKL-7890", slot: "D-01", company: "Airport Parking Ltd.", date: "2026-02-20", duration: "4h", cost: "$20.00", status: "Completed" },
  { id: "B006", vehicle: "MNO-2345", slot: "B-03", company: "Downtown Parking Co.", date: "2026-02-19", duration: "6h", cost: "$30.00", status: "Completed" },
];

export default function BookingHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = demoHistory.filter((b) => {
    const matchesSearch = b.vehicle.toLowerCase().includes(search.toLowerCase()) ||
      b.slot.toLowerCase().includes(search.toLowerCase()) ||
      b.company.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    Active: "bg-accent text-accent-foreground",
    Completed: "bg-success/10 text-success",
    Cancelled: "bg-destructive/10 text-destructive",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h3 className="text-xl font-bold text-foreground">Booking History</h3>
          <p className="text-sm text-muted-foreground">View all your past and current bookings</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vehicle, slot, or company..."
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium">ID</th>
                  <th className="text-left px-6 py-3 font-medium">Vehicle</th>
                  <th className="text-left px-6 py-3 font-medium">Slot</th>
                  <th className="text-left px-6 py-3 font-medium">Company</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-left px-6 py-3 font-medium">Duration</th>
                  <th className="text-left px-6 py-3 font-medium">Cost</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                      <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">{b.id}</td>
                      <td className="px-6 py-3 text-foreground">{b.vehicle}</td>
                      <td className="px-6 py-3 text-foreground">{b.slot}</td>
                      <td className="px-6 py-3 text-foreground">{b.company}</td>
                      <td className="px-6 py-3 text-muted-foreground">{b.date}</td>
                      <td className="px-6 py-3 text-muted-foreground">{b.duration}</td>
                      <td className="px-6 py-3 font-semibold text-foreground">{b.cost}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || "bg-secondary text-secondary-foreground"}`}>
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
