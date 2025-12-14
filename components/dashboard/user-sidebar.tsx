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
    Sparkles
} from "lucide-react";

export function UserSidebar({ user }: { user: any }) {
    const pathname = usePathname();

    const navItems = [
        { name: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
        { name: "葵さん", href: "/dashboard/chat", icon: Sparkles },
        { name: "会議管理", href: "/dashboard/meetings", icon: Calendar },
        { name: "役員管理", href: "/dashboard/officers", icon: Users },
        { name: "議案書の作成", href: "/dashboard/documents/create", icon: FileText },
        { name: "書類管理", href: "/dashboard/documents", icon: FolderOpen },
        { name: "定款・規程", href: "/dashboard/rules", icon: Book },
        { name: "組織情報", href: "/dashboard/organization", icon: Building },
    ];

    return (
        <aside className="w-64 border-r border-gray-200 bg-white flex flex-col h-full">
            {/* Brand Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        葵
                    </div>
                    <div>
                        <div className="font-bold text-gray-900">S級AI事務局 葵さん</div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            社会福祉法人サポート
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <item.icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {user?.email?.[0].toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900">
                            {user?.email || "ユーザー"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            スタンダードプラン
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
