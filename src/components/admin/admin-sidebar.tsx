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

interface AdminSidebarProps {
    currentUser?: {
        email: string
        role: string
        name?: string
    }
}

export function AdminSidebar({ currentUser }: AdminSidebarProps) {
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
                    プラン管理
                </Link>

                <Link
                    href="/admin/features"
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/features') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                >
                    <Tags className="h-4 w-4" />
                    機能管理
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

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                {currentUser && (
                    <div className="mb-4 px-4 py-2 bg-slate-800 rounded-lg">
                        <div className="text-xs text-slate-400 font-medium">Logged in as</div>
                        <div className="text-sm font-bold truncate" title={currentUser.email}>
                            {currentUser.email}
                        </div>
                        <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-900 text-indigo-200 border border-indigo-700">
                            {currentUser.role === 'super_admin' ? 'Super Admin' : 'Editor'}
                        </div>
                    </div>
                )}

                <form action={logout}>
                    <button type="submit" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors w-full text-left rounded-lg hover:bg-slate-800">
                        <LogOut className="h-4 w-4" />
                        ログアウト
                    </button>
                </form>
            </div>
        </aside>
    )
}
