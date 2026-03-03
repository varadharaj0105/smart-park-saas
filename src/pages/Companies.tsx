import DashboardLayout from "@/components/DashboardLayout";
import { Building2, Plus, Mail, MapPin, User, Hash } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetCompanies } from "@/lib/api";
import { useNotification } from "@/components/NotificationProvider";

interface Company {
    id: number;
    name: string;
    admin_id: number;
    admin_name?: string;
    admin_email?: string;
    latitude: number | null;
    longitude: number | null;
}

export default function Companies() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const response = await apiGetCompanies();
            if (response && response.success && Array.isArray(response.data)) {
                setCompanies(response.data);
            } else if (Array.isArray(response)) {
                setCompanies(response);
            } else {
                setCompanies([]);
            }
        } catch (error: any) {
            showNotification(error.message || "Failed to load companies", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Registered Companies</h3>
                        <p className="text-sm text-muted-foreground">Manage all companies and their assigned admins.</p>
                    </div>
                    <button
                        onClick={() => navigate('/map')}
                        className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus className="h-4 w-4" /> Add Company
                    </button>
                </div>

                {loading ? (
                    <div className="text-center p-12 text-muted-foreground">Loading companies...</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {companies.map((company) => (
                            <div
                                key={company.id}
                                onClick={() => navigate(`/companies/${company.id}`)}
                                className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">{company.name}</h4>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Hash className="h-3 w-3" /> ID: {company.id}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-foreground">{company.admin_name || `Admin ID: ${company.admin_id}`}</span>
                                    </div>
                                    {company.admin_email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">{company.admin_email}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm pt-2">
                                        <MapPin className={`h-4 w-4 ${company.latitude ? 'text-success' : 'text-muted-foreground'}`} />
                                        <span className={company.latitude ? "text-foreground" : "text-muted-foreground italic"}>
                                            {company.latitude ? "Location mapped" : "No location set"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
