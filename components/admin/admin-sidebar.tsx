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
    Shield
} from "lucide-react";

export function AdminSidebar({ user }: { user: any }) {
    const pathname = usePathname();

    const navItems = [
        { name: "概要", href: "/admin", icon: LayoutDashboard },
        { name: "ユーザー管理", href: "/admin/users", icon: Users },
        { name: "プラン管理", href: "/admin/plans", icon: CreditCard },
        { name: "プロンプト管理", href: "/admin/prompts", icon: MessageSquare },
        { name: "システムログ", href: "/admin/logs", icon: FileText },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
            {/* Brand Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-gray-900">GovAI Console</div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Admin
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-0.5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <item.icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Admin Footer */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                        A
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900">
                            {user?.email || "Admin"}
                        </p>
                        <p className="text-xs text-gray-500">
                            Super Admin
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
