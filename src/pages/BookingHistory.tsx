// ============================================
// Booking History Page
// ============================================

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Search, Filter, CalendarCheck, CreditCard } from "lucide-react";
import { apiExitBooking, apiGetBookings } from "@/lib/api";

interface BookingRow {
  id: number;
  vehicle_number: string;
  slot_id: number;
  start_time: string;
  duration: number;
  status: "active" | "completed" | "cancelled";
  total_amount: number | null;
  company_name?: string;
}

export default function BookingHistory() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [payingId, setPayingId] = useState<number | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentStage, setPaymentStage] = useState<"idle" | "calculating" | "processing" | "success">("idle");

  const loadBookings = () => {
    apiGetBookings()
      .then((result) => {
        setRows(result.data || result);
      })
      .catch(() => {
        setRows([]);
      });
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filtered = rows.filter((b) => {
    const matchesSearch =
      b.vehicle_number.toLowerCase().includes(search.toLowerCase()) ||
      String(b.slot_id).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    active: "bg-accent text-accent-foreground",
    completed: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
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
                      <td className="px-6 py-3 text-foreground">{b.vehicle_number}</td>
                      <td className="px-6 py-3 text-foreground">{b.slot_id}</td>
                      <td className="px-6 py-3 text-foreground">{b.company_name || "—"}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(b.start_time).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{b.duration}h</td>
                      <td className="px-6 py-3 font-semibold text-foreground">
                        {b.total_amount != null ? `$${Number(b.total_amount).toFixed(2)}` : "-"}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || "bg-secondary text-secondary-foreground"}`}>
                            {b.status}
                          </span>
                          {b.status === "active" && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingId(b.id);
                                setShowPayModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border text-xs text-foreground hover:bg-secondary"
                            >
                              <CreditCard className="h-3 w-3" /> Exit &amp; Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exit & Pay modal with simple animation */}
        {showPayModal && payingId !== null && (
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-lg">Exit &amp; Pay</h3>
                <button
                  onClick={() => {
                    if (paymentStage !== "idle") return;
                    setShowPayModal(false);
                    setPayingId(null);
                  }}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                  disabled={paymentStage !== "idle"}
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                We&apos;ll calculate your stay, record payment, and free the slot.
              </p>

              <div className="flex items-center gap-3 min-h-[40px] mb-4 bg-muted/30 p-3 rounded-lg">
                {paymentStage !== "idle" && paymentStage !== "success" && (
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
                {paymentStage === "success" && (
                  <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center animate-scale-in">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">
                  {paymentStage === "idle" && "Ready to complete payment."}
                  {paymentStage === "calculating" && "Calculating final duration & fee..."}
                  {paymentStage === "processing" && "Processing payment gateway..."}
                  {paymentStage === "success" && "Payment Approved! Releasing slot..."}
                </span>
              </div>

              <button
                type="button"
                disabled={paymentStage !== "idle"}
                onClick={async () => {
                  try {
                    setPaymentStage("calculating");
                    await new Promise(r => setTimeout(r, 800));

                    setPaymentStage("processing");
                    await new Promise(r => setTimeout(r, 1200));

                    setPaymentStage("success");
                    await new Promise(r => setTimeout(r, 800));

                    await apiExitBooking(String(payingId));
                    loadBookings();
                    setShowPayModal(false);
                    setPayingId(null);
                    setPaymentStage("idle");
                  } catch {
                    setPaymentStage("idle");
                    // handled by api layer / notifications
                  }
                }}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {paymentStage !== "idle" ? "Processing..." : "Complete Exit & Payment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
