// ============================================
// Payments Page — Enhanced with payment methods
// ============================================

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { useNotification } from "@/components/NotificationProvider";
import { getAuth } from "@/lib/auth";
import { CreditCard, DollarSign, Receipt, TrendingUp, Plus, X, Search } from "lucide-react";

const payments = [
  { id: "P001", booking: "B001", amount: "$15.00", method: "Card", date: "2026-02-24", status: "Paid" },
  { id: "P002", booking: "B002", amount: "$25.00", method: "Card", date: "2026-02-23", status: "Paid" },
  { id: "P003", booking: "B003", amount: "$10.00", method: "Cash", date: "2026-02-22", status: "Paid" },
  { id: "P004", booking: "B004", amount: "$40.00", method: "UPI", date: "2026-02-21", status: "Pending" },
  { id: "P005", booking: "B005", amount: "$20.00", method: "UPI", date: "2026-02-20", status: "Paid" },
  { id: "P006", booking: "B006", amount: "$30.00", method: "Card", date: "2026-02-19", status: "Refunded" },
];

export default function Payments() {
  const [search, setSearch] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ booking_id: "", amount: "", method: "Card" });
  const { showNotification } = useNotification();
  const auth = getAuth();
  const role = auth?.role || "user";

  const filtered = payments.filter(
    (p) => p.id.toLowerCase().includes(search.toLowerCase()) || p.booking.toLowerCase().includes(search.toLowerCase())
  );

  const handlePay = () => {
    if (!payForm.booking_id || !payForm.amount) {
      showNotification("Please fill all fields", "warning");
      return;
    }
    showNotification("Payment recorded successfully!", "success");
    setShowPayModal(false);
    setPayForm({ booking_id: "", amount: "", method: "Card" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">Payments</h3>
            <p className="text-sm text-muted-foreground">View all payment transactions</p>
          </div>
          {(role === "user" || role === "admin") && (
            <button
              onClick={() => setShowPayModal(true)}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> {role === "user" ? "Pay Booking" : "Record Payment"}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Revenue" value="$140.00" icon={DollarSign} trend="up" trendValue="+12%" />
          <StatCard title="Transactions" value={payments.length} icon={Receipt} />
          <StatCard title="Paid" value={payments.filter((p) => p.status === "Paid").length} icon={CreditCard} />
          <StatCard title="Pending" value={payments.filter((p) => p.status === "Pending").length} icon={TrendingUp} />
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payments..."
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Payments table */}
        <div className="bg-card border border-border rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-6 py-3 font-medium">Payment ID</th>
                  <th className="text-left px-6 py-3 font-medium">Booking</th>
                  <th className="text-left px-6 py-3 font-medium">Amount</th>
                  <th className="text-left px-6 py-3 font-medium">Method</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-foreground">{p.id}</td>
                    <td className="px-6 py-3 text-foreground">{p.booking}</td>
                    <td className="px-6 py-3 font-semibold text-foreground">{p.amount}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{p.date}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "Paid" ? "bg-success/10 text-success"
                        : p.status === "Pending" ? "bg-warning/10 text-warning"
                        : "bg-secondary text-secondary-foreground"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pay Modal */}
        {showPayModal && (
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-lg">
                  {role === "user" ? "Pay for Booking" : "Record Payment"}
                </h3>
                <button onClick={() => setShowPayModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Booking ID</label>
                  <input
                    value={payForm.booking_id}
                    onChange={(e) => setPayForm({ ...payForm, booking_id: e.target.value })}
                    placeholder="e.g. B001"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Amount ($)</label>
                  <input
                    type="number"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Card", "UPI", "Cash"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayForm({ ...payForm, method: m })}
                        className={`h-10 rounded-lg border text-sm font-medium transition-all ${
                          payForm.method === m
                            ? "border-primary bg-accent text-accent-foreground ring-2 ring-ring"
                            : "border-border text-foreground hover:bg-secondary"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handlePay}
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
