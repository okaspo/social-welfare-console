'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, MoreHorizontal, Shield, Mail, Lock, Ban,
    CreditCard, Building, Eye, ChevronRight, X
} from 'lucide-react';
import {
    updateUserEmail, sendPasswordReset, forceUpdatePassword,
    toggleBanUser, unbanUser, overrideUserPlan, getUserPrivateData
} from '@/lib/actions/admin-users';

// --- UI Components (Simplified for single file) ---
function Button({ children, onClick, variant = 'primary', size = 'md', className = '', ...props }: any) {
    const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
    const variants: any = {
        primary: "bg-slate-900 text-white hover:bg-slate-800",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-slate-200 hover:bg-slate-100",
        ghost: "hover:bg-slate-100 text-slate-700",
        link: "text-blue-600 underline-offset-4 hover:underline",
    };
    const sizes: any = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        icon: "h-10 w-10",
    };
    return (
        <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} {...props}>
            {children}
        </button>
    );
}

function Input({ className = '', ...props }: any) {
    return (
        <input
            className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        />
    );
}

function Badge({ children, variant = "default" }: any) {
    const variants: any = {
        default: "bg-slate-100 text-slate-800",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        destructive: "bg-red-100 text-red-800",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]}`}>
            {children}
        </span>
    );
}

// --- Main Component ---
export default function UserManagementClient({ initialUsers }: { initialUsers: any[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [privateData, setPrivateData] = useState<any>(null);
    const [isPending, startTransition] = useTransition();

    // Search Handler
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/admin/users?q=${encodeURIComponent(searchTerm)}`);
    };

    // --- Actions ---
    const handleViewPrivateData = async (userId: string) => {
        if (!confirm("WARNING: This action will be logged in the Admin Audit Logs. Continue?")) return;

        startTransition(async () => {
            try {
                const data = await getUserPrivateData(userId);
                setPrivateData(data);
            } catch (err: any) {
                alert(`Error: ${err.message}`);
            }
        });
    };

    const handleEmailUpdate = async (newEmail: string) => {
        if (!selectedUser || !newEmail) return;
        if (!confirm(`Change email for ${selectedUser.full_name || 'User'} to ${newEmail}?`)) return;

        startTransition(async () => {
            try {
                await updateUserEmail(selectedUser.id, newEmail);
                alert("Email updated. User must verify if configured.");
                // Refresh list logic if needed
            } catch (err: any) {
                alert(`Error: ${err.message}`);
            }
        });
    }

    const handlePasswordReset = async () => {
        if (!confirm("Send password reset email?")) return;
        startTransition(async () => {
            try {
                await sendPasswordReset(selectedUser.id);
                alert("Password reset email sent.");
            } catch (err: any) {
                alert(`Error: ${err.message}`);
            }
        });
    };

    const handleForcePassword = async () => {
        const newPass = prompt("Enter new password (leaves no trace for user!):");
        if (!newPass) return;
        startTransition(async () => {
            try {
                await forceUpdatePassword(selectedUser.id, newPass);
                alert("Password updated.");
            } catch (err: any) {
                alert(`Error: ${err.message}`);
            }
        });
    };

    const handleBan = async () => {
        startTransition(async () => {
            await toggleBanUser(selectedUser.id, 24); // 24h ban example
            alert("User banned for 24h.");
        });
    };

    const handlePlanChange = async (plan: string) => {
        if (!selectedUser.organization?.id) return alert("No organization linked");
        if (!confirm(`Force switch plan to ${plan}?`)) return;

        startTransition(async () => {
            try {
                await overrideUserPlan(selectedUser.organization.id, plan);
                alert("Plan updated.");
                // Optimistic update?
                setSelectedUser((prev: any) => ({
                    ...prev,
                    organization: { ...prev.organization, plan_id: plan }
                }));
            } catch (err: any) {
                alert(`Error: ${err.message}`);
            }
        });
    };

    return (
        <div className="relative">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search users..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e: any) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button type="submit" variant="outline">Search</Button>
            </form>

            {/* Users Table */}
            <div className="border rounded-md bg-white overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b text-slate-500 font-medium">
                        <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Organization</th>
                            <th className="px-4 py-3">Plan</th>
                            <th className="px-4 py-3">Joined</th>
                            <th className="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {initialUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-slate-900">{user.full_name || 'No Name'}</div>
                                    <div className="text-slate-500 text-xs">{user.id}</div>
                                </td>
                                <td className="px-4 py-3">
                                    {user.organization?.name || <span className="text-slate-400 italic">None</span>}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge variant={user.organization?.plan_id === 'pro' ? 'success' : 'default'}>
                                        {user.organization?.plan_id || 'free'}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-slate-500">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3">
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(user); setPrivateData(null); }}>
                                        Manage
                                        <ChevronRight className="ml-1 w-3 h-3" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail Drawer (Overlay) */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity animate-in fade-in" onClick={() => setSelectedUser(null)}>
                    <div className="w-full max-w-2xl bg-white h-full shadow-2xl p-0 flex flex-col animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="p-6 border-b flex justify-between items-start bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {selectedUser.full_name}
                                    {/* {selectedUser.banned && <Badge variant="destructive">Banned</Badge>} */}
                                </h2>
                                <p className="text-sm text-slate-500 font-mono mt-1">{selectedUser.id}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Section: Account Security */}
                            <section>
                                <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-4 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-slate-500" />
                                    Account Security
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 border rounded-md bg-slate-50/50">
                                        <Mail className="w-5 h-5 text-slate-400" />
                                        <div className="flex-1">
                                            <label className="text-xs font-medium text-slate-500">Email Address</label>
                                            <div className="flex gap-2">
                                                {/* Placeholder for email display/edit logic */}
                                                <input type="email" defaultValue="user@example.com" disabled className="bg-transparent font-medium w-full text-slate-700" />
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => prompt("New email:", "user@example.com") && handleEmailUpdate(prompt("New email:", "user@example.com")!)}>Edit</Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Button variant="outline" className="justify-start" onClick={handlePasswordReset}>
                                            <Lock className="w-4 h-4 mr-2" /> Send Reset Link
                                        </Button>
                                        <Button variant="outline" className="justify-start" onClick={handleForcePassword}>
                                            <Lock className="w-4 h-4 mr-2" /> Force New Password
                                        </Button>
                                        <Button variant="destructive" className="justify-start col-span-2" onClick={handleBan}>
                                            <Ban className="w-4 h-4 mr-2" /> Ban User (24h)
                                        </Button>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Organization & Plan */}
                            <section>
                                <h3 className="text-sm font-semibold text-slate-900 border-b pb-2 mb-4 flex items-center gap-2">
                                    <Building className="w-4 h-4 text-slate-500" />
                                    Organization & Plan
                                </h3>
                                {selectedUser.organization ? (
                                    <div className="space-y-4">
                                        <div className="p-4 border rounded-md bg-white">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-medium">{selectedUser.organization.name}</span>
                                                <span className="text-xs font-mono text-slate-400">{selectedUser.organization.id}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                                                <CreditCard className="w-4 h-4" />
                                                Current Plan: <span className="font-semibold uppercase">{selectedUser.organization.plan_id}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant={selectedUser.organization.plan_id === 'free' ? 'primary' : 'outline'} onClick={() => handlePlanChange('free')}>Set Free</Button>
                                                <Button size="sm" variant={selectedUser.organization.plan_id === 'pro' ? 'primary' : 'outline'} onClick={() => handlePlanChange('pro')}>Set Pro</Button>
                                                <Button size="sm" variant={selectedUser.organization.plan_id === 'enterprise' ? 'primary' : 'outline'} onClick={() => handlePlanChange('enterprise')}>Set Enterprise</Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic">No organization found.</p>
                                )}
                            </section>

                            {/* Section: God Mode */}
                            <section className="pt-4 border-t border-red-100">
                                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                                    <h3 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-3">
                                        <Eye className="w-4 h-4" />
                                        God Mode: Data Access
                                    </h3>
                                    <p className="text-xs text-red-600 mb-4">
                                        Clicking below will fetch private User/Organization data.
                                        <strong> This action is audited.</strong>
                                    </p>

                                    {!privateData ? (
                                        <Button variant="destructive" className="w-full" onClick={() => handleViewPrivateData(selectedUser.id)}>
                                            Access Private Data
                                        </Button>
                                    ) : (
                                        <div className="space-y-2 animate-in fade-in">
                                            <div className="text-xs font-mono bg-slate-900 text-green-400 p-4 rounded overflow-auto max-h-60">
                                                {JSON.stringify(privateData, null, 2)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
