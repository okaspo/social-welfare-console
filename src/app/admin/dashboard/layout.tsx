import { ShieldCheck, Users, Settings, LogOut, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold">Admin Console</h1>
                            <p className="text-xs text-gray-400">System Operations</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors bg-gray-800"
                    >
                        <Users className="h-4 w-4" />
                        ユーザー管理
                    </Link>
                    <Link
                        href="/admin/dashboard/knowledge"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                    >
                        <BookOpen className="h-4 w-4" />
                        共通知識ライブラリ
                    </Link>
                    <Link
                        href="/admin/dashboard/prompt"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                    >
                        <Settings className="h-4 w-4" />
                        AIプロンプト管理
                    </Link>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded-md transition-colors mt-8">
                        <LogOut className="h-4 w-4" />
                        ログアウト
                    </button>
                </nav>

                <div className="p-4 text-xs text-gray-600 border-t border-gray-800">
                    Administrator Access Only
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
