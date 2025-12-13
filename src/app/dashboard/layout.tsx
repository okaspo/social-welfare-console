import Link from 'next/link'
import AoiChat from '@/components/chat/aoi-chat'
import {
    LayoutDashboard,
    Users,
    FileText,
    BookOpen,
    Calendar,
    Settings,
    LogOut,
    ShieldCheck,
    Building2
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'

// ... existing imports ...

// Sidebar Item Component
function SidebarItem({ href, icon: Icon, label, active = false }: { href: string; icon: any; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${active
                ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
        >
            <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${active ? 'text-gray-900' : 'text-gray-500'}`} />
            {label}
        </Link>
    )
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let corporationName = '社会福祉法人 〇〇会'
    let userInitials = 'AD'
    let organizationPlan: string | null = null

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select(`
                corporation_name, 
                full_name,
                organization:organizations (
                    id,
                    name,
                    plan
                )
            `)
            .eq('id', user.id)
            .single()

        if (profile?.organization) {
            const org = Array.isArray(profile.organization) ? profile.organization[0] : profile.organization
            // Use organization name if available
            if (org?.name) {
                corporationName = org.name
            } else if (profile?.corporation_name) {
                corporationName = profile.corporation_name
            }
            organizationPlan = (org as any)?.plan
        }

        if (profile?.full_name) {
            // Simple logic to get first 2 chars or specific initials if needed. 
            // For Japanese names, usually just the first char or so. Adjusting to show first 2 chars for now.
            userInitials = profile.full_name.slice(0, 2)
        }
    }

    return (
        <div className="flex min-h-screen bg-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-100 flex flex-col bg-white shadow-sm">
                <div className="p-6 h-16 flex items-center border-b border-gray-50">
                    <span className="font-bold text-lg text-gray-900 tracking-tight">S級AI事務局 葵さん</span>
                </div>

                <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    <SidebarItem href="/dashboard" icon={LayoutDashboard} label="ダッシュボード" active={true} />
                    <SidebarItem href="/dashboard/chat" icon={ShieldCheck} label="葵さん" active={false} />
                    <SidebarItem href="/dashboard/meetings" icon={Calendar} label="会議管理" />
                    <SidebarItem href="/dashboard/officers" icon={Users} label="役員管理" />


                    <SidebarItem href="/dashboard/documents/new" icon={FileText} label="議案書の作成" />
                    <SidebarItem href="/dashboard/documents" icon={FileText} label="書類管理" />
                    <SidebarItem href="/dashboard/articles" icon={BookOpen} label="定款・規程" />
                    <SidebarItem href="/dashboard/organization" icon={Building2} label="組織情報" />
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                    <SidebarItem href="/dashboard/settings" icon={Settings} label="設定" />
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

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-white to-gray-50/30">
                {/* Header */}
                <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                        {corporationName}
                        {organizationPlan && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${organizationPlan === 'PRO' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                organizationPlan === 'ENTERPRISE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                {organizationPlan}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 shadow-sm ring-2 ring-white">
                            {userInitials}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-8 md:p-10 overflow-auto">
                    {children}
                </div>
            </main>

            <AoiChat />
        </div>
    )
}
// Force redeploy timestamp: 2025-12-08 23:30
