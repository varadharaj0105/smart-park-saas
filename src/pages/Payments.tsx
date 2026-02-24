// ============================================
// Payments Page
// ============================================

import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { CreditCard, DollarSign, Receipt, TrendingUp } from "lucide-react";

const payments = [
  { id: "P001", booking: "B001", amount: "$15.00", method: "Card", date: "2026-02-24", status: "Paid" },
  { id: "P002", booking: "B002", amount: "$25.00", method: "Card", date: "2026-02-23", status: "Paid" },
  { id: "P003", booking: "B003", amount: "$10.00", method: "Cash", date: "2026-02-22", status: "Paid" },
  { id: "P004", booking: "B004", amount: "$40.00", method: "Card", date: "2026-02-21", status: "Pending" },
  { id: "P005", booking: "B005", amount: "$20.00", method: "UPI", date: "2026-02-20", status: "Paid" },
  { id: "P006", booking: "B006", amount: "$30.00", method: "Card", date: "2026-02-19", status: "Refunded" },
];

export default function Payments() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground">Payments</h3>
          <p className="text-sm text-muted-foreground">View all payment transactions</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Revenue" value="$140.00" icon={DollarSign} trend="up" trendValue="+12%" />
          <StatCard title="Transactions" value={payments.length} icon={Receipt} />
          <StatCard title="Paid" value={payments.filter((p) => p.status === "Paid").length} icon={CreditCard} />
          <StatCard title="Pending" value={payments.filter((p) => p.status === "Pending").length} icon={TrendingUp} />
        </div>

        {/* Payments table */}
        <div className="bg-card border border-border rounded-lg">
          <div className="px-6 py-4 border-b border-border">
            <h4 className="font-semibold text-foreground">Transaction History</h4>
          </div>
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
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium text-foreground">{p.id}</td>
                    <td className="px-6 py-3 text-foreground">{p.booking}</td>
                    <td className="px-6 py-3 font-semibold text-foreground">{p.amount}</td>
                    <td className="px-6 py-3 text-foreground">{p.method}</td>
                    <td className="px-6 py-3 text-muted-foreground">{p.date}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === "Paid"
                            ? "bg-accent text-accent-foreground"
                            : p.status === "Pending"
                            ? "bg-warning/10 text-warning"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {p.status}
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
