import {
    CalendarDays,
    AlertCircle,
    ArrowRight,
    Search,
    FileText,
    Users
} from 'lucide-react'
import Link from 'next/link'
import { DailyMutter } from '@/components/dashboard/daily-mutter';

function TodoCard({ title, due, type, href }: { title: string; due: string; type: 'urgent' | 'info'; href: string }) {
    return (
        <Link href={href} className="block group">
            <div className={`p-4 rounded-xl border transition-all duration-200 ${type === 'urgent'
                ? 'bg-red-50 border-red-100 hover:border-red-200 hover:shadow-md'
                : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md'
                }`}>
                <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg shrink-0 ${type === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {type === 'urgent' ? <AlertCircle className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
                    </div>
                    <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${type === 'urgent' ? 'text-red-600' : 'text-blue-600'
                            }`}>
                            {due}
                        </p>
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                            {title}
                        </h3>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 ml-auto self-center group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    )
}

export default function DashboardPage() {
    return (
        <div className="space-y-10 max-w-4xl mx-auto pb-20">
            {/* 1. Daily Engagement Widget */}
            <div className="animate-in slide-in-from-top-4 duration-500">
                <DailyMutter />
            </div>

            {/* 2. Main Greeting */}
            <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    こんにちは、葵です。
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    本日の業務をサポートします。招集通知の作成、議事録のチェック、<br />
                    あるいは法的な疑問について、何でもお聞きください。
                </p>

                {/* Visual Search Box (Functional Mockup - Links to Chat) */}
                <Link href="/dashboard/chat" className="block max-w-xl mx-auto group">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div className="block w-full text-left pl-11 pr-4 py-4 border-2 border-gray-200 rounded-2xl bg-white text-gray-500 shadow-sm group-hover:border-indigo-500 group-hover:shadow-lg transition-all duration-300">
                            「理事会の招集通知を作って」と聞いてみてください...
                        </div>
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <span className="bg-gray-100 text-gray-400 text-xs font-semibold px-2 py-1 rounded-md group-hover:bg-indigo-50 group-hover:text-indigo-600">Enter</span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* 3. To-Do Cards (Only actionable items) */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-indigo-600" />
                    対応が必要なタスク
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <TodoCard
                        title="定時評議員会の招集通知発送"
                        due="期限: あと3日"
                        type="urgent"
                        href="/dashboard/meetings"
                    />
                    <TodoCard
                        title="理事会議事録の署名確認"
                        due="保留中: 1件"
                        type="info"
                        href="/dashboard/documents"
                    />
                    <TodoCard
                        title="役員任期満了の事前確認"
                        due="6月改選"
                        type="info"
                        href="/dashboard/officers"
                    />
                </div>
            </div>

            {/* 4. Shortcuts (Hidden Complexity) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                <Link href="/dashboard/meetings/new" className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group text-center">
                    <CalendarDays className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 mb-3 transition-colors" />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">会議招集</span>
                </Link>
                <Link href="/dashboard/documents/new" className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group text-center">
                    <FileText className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 mb-3 transition-colors" />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">議案書作成</span>
                </Link>
                <Link href="/dashboard/officers" className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group text-center">
                    <Users className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 mb-3 transition-colors" />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">役員名簿</span>
                </Link>
                <Link href="/dashboard/articles" className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group text-center">
                    <Search className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 mb-3 transition-colors" />
                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">定款検索</span>
                </Link>
            </div>
        </div>
    )
}
