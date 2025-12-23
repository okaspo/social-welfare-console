'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import clsx from 'clsx'

interface UsageStats {
    currentUsage: number
    maxLimit: number
    planName: string
}

export default function UsagePage() {
    const [stats, setStats] = useState<UsageStats | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchUsage()
    }, [])

    const fetchUsage = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Get Org & Plan Limits
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        const orgId = profile?.organization_id
        if (!orgId) {
            setLoading(false)
            return
        }

        const { data: org } = await supabase
            .from('organizations')
            .select(`
                plan,
                plan_details:plan_id (
                    max_monthly_cost_usd
                )
            `)
            .eq('id', orgId)
            .single()

        // 2. Aggregate Usage Logs (Client-side aggregation for now, or use RPC ideally)
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const { data: logs } = await supabase
            .from('usage_logs')
            .select('estimated_cost_usd')
            .eq('organization_id', orgId)
            .gte('created_at', firstDay)

        const totalCost = logs?.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0) || 0

        // 3. Fallbacks
        let limit = 1.0;
        const plan = org?.plan?.toUpperCase() || 'FREE'
        // @ts-ignore
        const dbLimit = org?.plan_details?.max_monthly_cost_usd;

        if (dbLimit) {
            limit = dbLimit;
        } else {
            if (plan === 'STANDARD') limit = 2.0;
            if (plan === 'PRO') limit = 20.0;
            if (plan === 'ENTERPRISE') limit = 100.0;
        }

        setStats({
            currentUsage: totalCost,
            maxLimit: limit,
            planName: plan
        })
        setLoading(false)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>
    if (!stats) return <div className="p-8">データが見つかりません</div>

    const percentage = Math.min((stats.currentUsage / stats.maxLimit) * 100, 100)
    const isPro = stats.planName === 'PRO' || stats.planName === 'ENTERPRISE'

    return (
        <div className="max-w-2xl mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">AIクレジット使用状況</h1>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            今月の利用量
                        </h2>
                        <p className="text-sm text-gray-500">
                            プランごとの技術的上限に対する利用率です。
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">
                            {isPro ? '無制限' : `${percentage.toFixed(1)}%`}
                        </span>
                        {isPro && <span className="block text-xs text-green-600 font-medium">Fair Usage Policy適用</span>}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                        className={clsx(
                            "absolute top-0 left-0 h-full transition-all duration-500",
                            percentage > 90 ? "bg-red-500" : (percentage > 70 ? "bg-yellow-500" : "bg-blue-600")
                        )}
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {percentage >= 100 && !isPro && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 text-sm">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <div>
                            <p className="font-bold">利用制限に達しました</p>
                            <p className="mt-1">
                                今月のAI利用可能枠を使い切りました。引き続き利用するには、Proプランへのアップグレードをご検討ください。
                            </p>
                        </div>
                    </div>
                )}

                {!isPro && percentage < 100 && (
                    <div className="mt-4 text-right">
                        <button
                            disabled
                            className="text-sm text-gray-400 cursor-not-allowed hover:text-gray-600 underline"
                        >
                            詳細なログを確認（Pro限定）
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-8 grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="font-medium text-gray-900 mb-2">現在のプラン</h3>
                    <div className="text-xl font-bold text-gray-800">{stats.planName}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h3 className="font-medium text-gray-900 mb-2">使用モデル</h3>
                    <div className="flex flex-wrap gap-2">
                        {isPro ? (
                            <>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">GPT-4o</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">GPT-4o mini</span>
                            </>
                        ) : (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">GPT-4o mini</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
