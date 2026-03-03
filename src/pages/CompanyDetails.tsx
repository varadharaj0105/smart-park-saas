import DashboardLayout from "@/components/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Building2, MapPin, Hash, User, Mail, CreditCard, ParkingSquare, Users } from "lucide-react";
import { apiGetCompanyDetails } from "@/lib/api";
import { useNotification } from "@/components/NotificationProvider";

// This would typically come from an API endpoint, e.g., /api/super/companies/:id
// but for the sake of immediate scaffolding, we'll build the UI first.
export default function CompanyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(true);

    // Mocks for now until we wire this to the backend
    const [companyDetails, setCompanyDetails] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);

    const [stats, setStats] = useState({ total_slots: 0, available_slots: 0, active_bookings: 0, total_revenue: 0 });

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const response = await apiGetCompanyDetails(id);
                if (response.success) {
                    setCompanyDetails(response.data.company);
                    setStats(response.data.stats);
                    setPayments(response.data.payments || []);
                } else {
                    showNotification(response.message || "Failed to load company", "error");
                }
            } catch (error: any) {
                showNotification(error.message || "Error fetching company data", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">
                            {companyDetails?.name || `Company #${id}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">View detailed analytics, slots, and payments for this tenant.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center p-12 text-muted-foreground">Loading company details...</div>
                ) : (
                    <div className="grid gap-6">

                        {/* Summary Cards */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="bg-card border border-border rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="font-medium text-foreground">Company Info</span>
                                </div>
                                <div className="space-y-1 mt-4">
                                    <div className="text-sm text-muted-foreground flex gap-2"><Hash className="h-4 w-4" /> ID: {id}</div>
                                    <div className="text-sm text-muted-foreground flex gap-2"><User className="h-4 w-4" /> {companyDetails?.admin_name}</div>
                                    <div className="text-sm text-muted-foreground flex gap-2"><Mail className="h-4 w-4" /> {companyDetails?.admin_email}</div>
                                    <div className="text-sm text-success flex gap-2 mt-2"><MapPin className="h-4 w-4" /> Location mapped</div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-center items-center text-center">
                                <ParkingSquare className="h-8 w-8 text-muted-foreground mb-2" />
                                <div className="text-3xl font-bold">{stats.total_slots}</div>
                                <div className="text-sm text-muted-foreground">Total Slots</div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-center items-center text-center">
                                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                                <div className="text-3xl font-bold">{stats.active_bookings}</div>
                                <div className="text-sm text-muted-foreground">Active Bookings</div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-center items-center text-center">
                                <CreditCard className="h-8 w-8 text-success mb-2" />
                                <div className="text-3xl font-bold text-success">${Number(stats.total_revenue).toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">Total Revenue</div>
                            </div>
                        </div>

                        {/* Recent Payments Table */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h4 className="font-semibold text-foreground mb-4">Recent Payments</h4>
                            {payments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    No payment history for this company yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="pb-3 font-medium text-muted-foreground text-sm">Amount</th>
                                                <th className="pb-3 font-medium text-muted-foreground text-sm">Status</th>
                                                <th className="pb-3 font-medium text-muted-foreground text-sm">User ID</th>
                                                <th className="pb-3 font-medium text-muted-foreground text-sm">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {payments.map(payment => (
                                                <tr key={payment.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                                    <td className="py-3 font-medium">${Number(payment.amount).toFixed(2)}</td>
                                                    <td className="py-3">
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-muted-foreground">#{payment.user_id}</td>
                                                    <td className="py-3 text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
