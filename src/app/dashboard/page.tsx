import {
    Users,
    CalendarDays,
    FileText,
    ArrowRight
} from 'lucide-react'
import Link from 'next/link'

function DashboardCard({ title, value, label, icon: Icon }: { title: string; value: string; label: string; icon: any }) {
    return (
        <div className="p-6 rounded-lg border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-gray-500">{title}</h3>
                <Icon className="h-4 w-4 text-gray-400" />
            </div>
            <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
        </div>
    )
}

function ActionCard({ title, description, href }: { title: string; description: string; href: string }) {
    return (
        <Link href={href} className="group block p-6 rounded-lg border border-gray-100 bg-white shadow-sm hover:border-gray-300 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-sm text-gray-500 mt-2">{description}</p>
        </Link>
    )
}

export default function DashboardPage() {
    return (
        <div className="space-y-8 max-w-5xl">
            {/* Welcome Section */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">ダッシュボード</h2>
                <p className="text-gray-500 mt-2">
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
                <h3 className="text-lg font-medium text-gray-900">クイックアクション</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <ActionCard
                        title="新しい会議を招集する"
                        description="理事会または評議員会の招集通知・議案書を作成します。"
                        href="/dashboard/meetings/new"
                    />
                    <ActionCard
                        title="議事録を作成する"
                        description="録音データやメモから、法務局提出用議事録を生成します。"
                        href="/dashboard/documents/new"
                    />
                </div>
            </div>
        </div>
    )
}
