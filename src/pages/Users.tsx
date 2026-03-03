import DashboardLayout from "@/components/DashboardLayout";
import { Users as UsersIcon, Plus, Mail, Shield, UserCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { apiGetUsers } from "@/lib/api";
import { useNotification } from "@/components/NotificationProvider";

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    tenant_id: number | null;
}

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await apiGetUsers();
            if (response && response.success && Array.isArray(response.data)) {
                setUsers(response.data.filter((u: User) => u.role === 'customer'));
            } else if (Array.isArray(response)) {
                setUsers(response.filter((u: User) => u.role === 'customer'));
            } else {
                setUsers([]);
            }
        } catch (error: any) {
            showNotification(error.message || "Failed to load users", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-foreground">User Management</h3>
                        <p className="text-sm text-muted-foreground">Manage all registered users across the system.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center p-12 text-muted-foreground">Loading users...</div>
                ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Name</th>
                                        <th className="px-6 py-4 font-medium">Email</th>
                                        <th className="px-6 py-4 font-medium">Role</th>
                                        <th className="px-6 py-4 font-medium">Company ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <UserCircle2 className="h-8 w-8 text-muted-foreground" />
                                                    <div className="font-medium text-foreground">{user.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Mail className="h-4 w-4" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Shield className={`h-4 w-4 ${user.role === 'superadmin' ? 'text-destructive' : user.role === 'admin' ? 'text-primary' : 'text-success'}`} />
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize 
                            ${user.role === 'superadmin' ? 'bg-destructive/10 text-destructive' :
                                                            user.role === 'admin' ? 'bg-primary/10 text-primary' :
                                                                'bg-success/10 text-success'}`}
                                                    >
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {user.tenant_id ? `#${user.tenant_id}` : 'None'}
                                            </td>
                                        </tr>
                                    ))}

                                    {users.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                                <UsersIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                No users found in the system.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
