'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Shield,
    Tags,
    FileText,
    LogOut,
    Activity
} from 'lucide-react'
import { logout } from '@/lib/actions/auth'

export function AdminSidebar() {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
            <div className="p-6 border-b border-slate-800">
                <span className="font-bold text-xl tracking-tight">GovAI Admin</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <Link
                    href="/admin/dashboard"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/dashboard') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    ダッシュボード
                </Link>

                <Link
                    href="/admin/staff"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/staff') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                >
                    <Shield className="h-4 w-4" />
                    運営チーム管理
                </Link>

                <Link
                    href="/admin/customers"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/customers') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                >
                    <Users className="h-4 w-4" />
                    顧客・法人管理
                </Link>

                <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Business Control
                </div>

                <Link
                    href="/admin/plans"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/plans') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                >
                    <Shield className="h-4 w-4" />
                    プラン機能管理
                </Link>

                <Link
                    href="/admin/campaigns"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/campaigns') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                >
                    <Tags className="h-4 w-4" />
                    キャンペーン管理
                </Link>

                <Link
                    href="/admin/audit"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/audit') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                >
                    <Activity className="h-4 w-4" />
                    監査ログ (Audit)
                </Link>
            </nav>

            <div className="p-4 border-t border-slate-800">
                <form action={logout}>
                    <button type="submit" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors w-full text-left">
                        <LogOut className="h-4 w-4" />
                        ログアウト
                    </button>
                </form>
            </div>
        </aside>
    )
}
