'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Calendar,
    Users,
    FileText,
    FolderOpen,
    Book,
    Building,
    LogOut,
    Sparkles
} from "lucide-react";

export function UserSidebar({ user }: { user: any }) {
    const pathname = usePathname();

    const navItems = [
        { name: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
        { name: "葵さん", href: "/dashboard/chat", icon: Sparkles }, // AI Chat
        { name: "会議管理", href: "/dashboard/meetings", icon: Calendar },
        { name: "役員管理", href: "/dashboard/officers", icon: Users },
        { name: "議案書の作成", href: "/dashboard/documents/create", icon: FileText },
        { name: "書類管理", href: "/dashboard/documents", icon: FolderOpen },
        { name: "定款・規程", href: "/dashboard/rules", icon: Book },
        { name: "組織情報", href: "/dashboard/organization", icon: Building },
    ];

    return (
        <aside className="w-64 border-r border-red-100 bg-white flex flex-col h-full shadow-sm">
            {/* Brand Header */}
            <div className="p-6 border-b border-red-50">
                <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-serif">
                        葵
                    </div>
                    S級AI事務局 葵さん
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    何かお困りですか？<br />社会福祉法人のことならお任せください
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all ${isActive
                                    ? "bg-red-50 text-red-700 shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <item.icon className={`w-4 h-4 ${isActive ? "text-red-500" : "text-slate-400"}`} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-red-50 bg-red-50/30">
                <div className="flex items-center gap-3 p-2 rounded-md">
                    <div className="w-8 h-8 rounded-full bg-white border border-red-100 flex items-center justify-center text-xs font-bold text-red-500 shadow-sm">
                        {user?.email?.[0].toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-slate-800">
                            {user?.email || "ユーザー"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                            スタンダードプラン
                        </p>
                    </div>
                    {/* Add logout button or functionality here if needed */}
                </div>
            </div>
        </aside>
    );
}
