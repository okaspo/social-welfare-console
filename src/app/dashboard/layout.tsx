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
    ShieldCheck
} from 'lucide-react'

// Sidebar Item Component
function SidebarItem({ href, icon: Icon, label, active = false }: { href: string; icon: any; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${active
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
        >
            <Icon className="h-4 w-4" />
            {label}
        </Link>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-100 flex flex-col bg-white">
                <div className="p-6 h-14 flex items-center">
                    <span className="font-semibold text-gray-900 tracking-tight">S級AI事務員 葵さん</span>
                </div>

                <div className="flex-1 px-3 py-4 space-y-1">
                    <SidebarItem href="/dashboard" icon={LayoutDashboard} label="ダッシュボード" active={true} />
                    <SidebarItem href="/dashboard/chat" icon={ShieldCheck} label="AI事務員 葵さん" active={false} />
                    <SidebarItem href="/dashboard/meetings" icon={Calendar} label="会議管理" />
                    <SidebarItem href="/dashboard/officers" icon={Users} label="役員管理" />


                    <SidebarItem href="/dashboard/documents/new" icon={FileText} label="議事録作成" />
                    <SidebarItem href="/dashboard/documents" icon={FileText} label="書類管理" />
                    <SidebarItem href="/dashboard/articles" icon={BookOpen} label="定款・規程" />
                </div>

                <div className="p-3 border-t border-gray-100">
                    <SidebarItem href="/dashboard/settings" icon={Settings} label="設定" />
                    <Link
                        href="/login"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors mt-1"
                    >
                        <LogOut className="h-4 w-4" />
                        ログアウト
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Header */}
                <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="text-sm font-medium text-gray-500">
                        社会福祉法人 〇〇会
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                            AD
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 p-6 md:p-8 overflow-auto">
                    {children}
                </div>
            </main>

            <AoiChat />
        </div>
    )
}
// Force redeploy timestamp: 2025-12-08 23:30
