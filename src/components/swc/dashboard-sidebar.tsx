'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    FileText,
    BookOpen,
    Calendar,
    Settings,
    LogOut,
    ShieldCheck,
    Building2,
    Coffee,
    Coins,
} from 'lucide-react'
import { FeedbackDialog } from '@/components/swc/feedback/feedback-dialog'
import { logout } from '@/lib/actions/auth'

// Sidebar Item Component
function SidebarItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    const pathname = usePathname()
    // Active logic for /swc/dashboard root vs subpaths
    const isActive = href === '/swc/dashboard'
        ? pathname === '/swc/dashboard'
        : pathname?.startsWith(href)

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
                ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
        >
            <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? 'text-gray-900' : 'text-gray-500'}`} />
            {label}
        </Link>
    )
}

export function SWCDashboardSidebar() {
    return (
        <aside className="w-64 border-r border-gray-100 flex flex-col bg-white shadow-sm">
            <div className="p-6 h-16 flex items-center border-b border-gray-50">
                <span className="font-bold text-lg text-gray-900 tracking-tight">S級AI事務局 葵さん</span>
            </div>

            <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
                {/* Group 1: 運営 (Daily) */}
                <div className="space-y-1">
                    <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">運営 (Daily)</div>
                    <SidebarItem href="/swc/dashboard" icon={LayoutDashboard} label="ダッシュボード" />
                    <SidebarItem href="/swc/dashboard/meetings" icon={Calendar} label="会議管理" />
                    <SidebarItem href="/swc/dashboard/chat" icon={ShieldCheck} label="葵さん (フル画面)" />
                    <SidebarItem href="/swc/dashboard/subsidies" icon={Coins} label="おすすめ助成金" />
                    <SidebarItem href="/swc/dashboard/break-room" icon={Coffee} label="休憩室" />
                </div>

                {/* Group 2: 組織 (Governance) */}
                <div className="space-y-1">
                    <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">組織 (Governance)</div>
                    <SidebarItem href="/swc/dashboard/officers" icon={Users} label="役員管理" />
                    <SidebarItem href="/swc/dashboard/documents" icon={FileText} label="書類管理" />
                    <SidebarItem href="/swc/dashboard/articles" icon={BookOpen} label="定款・規程" />
                </div>

                {/* Group 3: 設定 (System) */}
                <div className="space-y-1">
                    <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">設定 (System)</div>
                    <SidebarItem href="/swc/dashboard/organization" icon={Building2} label="組織情報" />
                    <SidebarItem href="/swc/dashboard/settings" icon={Settings} label="設定" />
                    <div className="px-3">
                        <FeedbackDialog />
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                <form action={logout}>
                    <button
                        type="submit"
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 mt-1 group"
                    >
                        <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        ログアウト
                    </button>
                </form>
            </div>
        </aside>
    )
}
