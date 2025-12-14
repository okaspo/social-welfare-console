'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    MessageSquare,
    FileText,
    Settings,
    ShieldAlert
} from "lucide-react";

export function AdminSidebar({ user }: { user: any }) {
    const pathname = usePathname();

    const navItems = [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
        { name: "User Management", href: "/admin/users", icon: Users },
        { name: "Plans", href: "/admin/plans", icon: CreditCard },
        { name: "Prompts", href: "/admin/prompts", icon: MessageSquare },
        { name: "System Logs", href: "/admin/logs", icon: FileText },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full">
            {/* Brand Header */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-xl text-red-500">
                    <ShieldAlert className="w-6 h-6" />
                    GovAI Console
                </div>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                    Administrative Access
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Admin Footer */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 p-2">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-bold text-red-500">
                        A
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {user?.email || "Admin"}
                        </p>
                        <p className="text-xs text-slate-500">
                            Super Admin
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
