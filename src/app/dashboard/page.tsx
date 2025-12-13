import {
    Users,
    CalendarDays,
    FileText,
    ArrowRight
} from 'lucide-react'
import Link from 'next/link'

function DashboardCard({ title, value, label, icon: Icon }: { title: string; value: string; label: string; icon: any }) {
    return (
        <div className="p-6 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between space-y-0 pb-3">
                <h3 className="tracking-tight text-sm font-medium text-gray-600">{title}</h3>
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-gray-600" />
                </div>
            </div>
            <div>
                <div className="text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
                <p className="text-xs text-gray-500 mt-2">{label}</p>
            </div>
        </div>
    )
}

function ActionCard({ title, description, href }: { title: string; description: string; href: string }) {
    return (
        <Link href={href} className="group block p-6 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 group-hover:text-gray-900">{title}</h3>
                <div className="h-8 w-8 rounded-lg bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition-all duration-300">
                    <ArrowRight className="h-4 w-4 text-gray-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{description}</p>
        </Link>
    )
}

export default function DashboardPage() {
    return (
        <div className="space-y-8 max-w-5xl">
            {/* Welcome Section */}
            <div className="mb-2">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">ダッシュボード</h2>
                <p className="text-gray-600 mt-3 text-base">
                    事務の葵です。今日の法務業務を確認しましょう。
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <DashboardCard
                    title="次回の会議"
                    value="3月25日"
                    label="定時評議員会（残り19日）"
                    icon={CalendarDays}
                />
                <DashboardCard
                    title="役員任期"
                    value="2名"
                    label="今年度改選対象者がいます"
                    icon={Users}
                />
                <DashboardCard
                    title="未処理タスク"
                    value="4件"
                    label="議事録署名が完了していません"
                    icon={FileText}
                />
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">クイックアクション</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <ActionCard
                        title="新しい会議を招集する"
                        description="理事会または評議員会の招集通知・議案書を作成します。"
                        href="/dashboard/meetings/new"
                    />
                    <ActionCard
                        title="議案書を作成する"
                        description="録音データやメモから、法務局提出用議事録を生成します。"
                        href="/dashboard/documents/new"
                    />
                </div>
            </div>
        </div>
    )
}
