// ============================================
// Payments Page — Enhanced with payment methods
// ============================================

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { useNotification } from "@/components/NotificationProvider";
import { getAuth } from "@/lib/auth";
import { CreditCard, DollarSign, Receipt, TrendingUp, Plus, X, Search } from "lucide-react";
import { apiExitBooking, apiGetBookings, apiGetPayments, apiGetSuperPayments } from "@/lib/api";

interface PaymentRow {
  id: number;
  booking_id: number;
  amount: number;
  method: string;
  status: "paid" | "pending" | "refunded";
  created_at: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ booking_id: "", method: "Card" });
  const [autoAmount, setAutoAmount] = useState<number>(0);
  const [calculating, setCalculating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentStage, setPaymentStage] = useState<"idle" | "initiating" | "processing" | "success">("idle");
  const { showNotification } = useNotification();
  const auth = getAuth();
  const role = auth?.role || "user";

  const loadInitialData = async () => {
    try {
      if (role === "superadmin") {
        const pResult = await apiGetSuperPayments();
        setPayments(pResult.data || pResult);
      } else {
        const pResult = await apiGetPayments();
        setPayments(pResult.data || pResult);
      }

      const bResult = await apiGetBookings();
      setBookings(bResult.data || bResult);
    } catch (error: any) {
      showNotification(error.message || "Failed to load data", "error");
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Recalculate cost when booking ID changes
  useEffect(() => {
    if (payForm.booking_id && bookings.length > 0) {
      const booking = bookings.find(b => String(b.id) === payForm.booking_id);
      if (booking && booking.status === "active") {
        setCalculating(true);
        // Pretend calculation delay
        setTimeout(() => {
          const hours = booking.duration || 1;
          const cost = hours * 5.00; // static 5$ per hour fallback if no rate available
          setAutoAmount(cost);
          setCalculating(false);
        }, 500);
      } else {
        setAutoAmount(0);
      }
    } else {
      setAutoAmount(0);
    }
  }, [payForm.booking_id, bookings]);

  const filtered = payments.filter(
    (p) =>
      String(p.id).toLowerCase().includes(search.toLowerCase()) ||
      String(p.booking_id).toLowerCase().includes(search.toLowerCase()),
  );

  const handlePay = async () => {
    if (!payForm.booking_id) {
      showNotification("Please fill all fields", "warning");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Initiating Connection (Fake)
      setPaymentStage("initiating");
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Processing Payment (Fake)
      setPaymentStage("processing");
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Step 3: Success Animation (Fake)
      setPaymentStage("success");
      await new Promise(resolve => setTimeout(resolve, 600));

      // Actual DB logic
      await apiExitBooking(payForm.booking_id, payForm.method.toLowerCase());
      showNotification("Payment recorded successfully!", "success");
      setShowPayModal(false);
      setPaymentStage("idle");
      setPayForm({ booking_id: "", method: "Card" });
      setAutoAmount(0);
      await loadInitialData();
    } catch (error: any) {
      showNotification(error.message || "Failed to record payment", "error");
      setPaymentStage("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">Payments</h3>
            <p className="text-sm text-muted-foreground">View all payment transactions</p>
          </div>
          {(role === "user" || role === "admin" || role === "superadmin") && (
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
          <StatCard
            title="Total Revenue"
            value={
              "$" +
              payments
                .filter((p) => p.status === "paid")
                .reduce((sum, p) => sum + Number(p.amount), 0)
                .toFixed(2)
            }
            icon={DollarSign}
            trend="up"
            trendValue="+"
          />
          <StatCard title="Transactions" value={payments.length} icon={Receipt} />
          <StatCard title="Paid" value={payments.filter((p) => p.status === "paid").length} icon={CreditCard} />
          <StatCard title="Pending" value={payments.filter((p) => p.status === "pending").length} icon={TrendingUp} />
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
                  {role === "superadmin" && <th className="text-left px-6 py-3 font-medium">Company</th>}
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
                    <td className="px-6 py-3 text-foreground">{p.booking_id}</td>
                    {role === "superadmin" && <td className="px-6 py-3 font-medium text-foreground">{(p as any).company_name || "—"}</td>}
                    <td className="px-6 py-3 font-semibold text-foreground">${Number(p.amount).toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "paid"
                        ? "bg-success/10 text-success"
                        : p.status === "pending"
                          ? "bg-warning/10 text-warning"
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
                    placeholder="e.g. 1"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {payForm.booking_id && bookings.find(b => String(b.id) === payForm.booking_id)?.status !== "active" && (
                    <span className="text-xs text-destructive mt-1 block">Booking not found or already paid.</span>
                  )}
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-sm font-medium text-foreground">Amount to Pay ($)</label>
                    <span className="text-xs text-muted-foreground">Auto-calculated</span>
                  </div>
                  <div className="w-full h-10 px-3 flex items-center bg-muted rounded-lg border border-border text-foreground text-sm font-semibold">
                    {calculating ? (
                      <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Calculating...</span>
                    ) : (
                      `$${autoAmount.toFixed(2)}`
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Card", "UPI", "Cash"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayForm({ ...payForm, method: m })}
                        className={`h-10 rounded-lg border text-sm font-medium transition-all ${payForm.method === m
                          ? "border-primary bg-accent text-accent-foreground ring-2 ring-ring"
                          : "border-border text-foreground hover:bg-secondary"
                          }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 min-h-[40px]">
                  {paymentStage !== "idle" && paymentStage !== "success" && (
                    <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  )}
                  {paymentStage === "success" && (
                    <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center animate-scale-in">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {paymentStage === "idle" && ""}
                    {paymentStage === "initiating" && `Connecting to ${payForm.method} gateway...`}
                    {paymentStage === "processing" && "Processing securely..."}
                    {paymentStage === "success" && "Payment Approved!"}
                  </span>
                </div>

                <button
                  onClick={handlePay}
                  disabled={loading || paymentStage !== "idle"}
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {paymentStage !== "idle" ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
