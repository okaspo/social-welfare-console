'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react'
import { changePlan, cancelSubscription, resumeSubscription } from '@/lib/actions/billing'
import { createCheckoutSession, createPortalSession } from '@/lib/stripe/actions'

type Price = {
    id: string
    amount: number
    interval: string
    currency: string
    plan_id: string
    plan_limits: {
        name: string
        features?: any
    } | null // Joined data
    campaign_code?: string | null
}

export default function PlanSettings({
    currentPlan,
    prices,
    isCanceled
}: {
    currentPlan: string,
    prices: Price[],
    isCanceled: boolean
}) {
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [interval, setInterval] = useState<'month' | 'year'>('month')
    const [isActionLoading, setIsActionLoading] = useState(false)

    // ... inside component ...

    const handlePlanChange = async (priceId: string) => {
        setIsLoading(priceId)
        try {
            // Direct call to server action
            const result = await createCheckoutSession(priceId, window.location.href)

            if (result.url) {
                window.location.href = result.url
            } else {
                alert('エラー: チェックアウトURLが取得できませんでした')
                setIsLoading(null)
            }
        } catch (error: any) {
            console.error(error)
            alert('エラーが発生しました: ' + (error.message || 'Unknown error'))
            setIsLoading(null)
        }
    }

    const handlePortal = async () => {
        try {
            const result = await createPortalSession(window.location.href)
            if (result.url) {
                window.location.href = result.url
            } else {
                alert('ポータルへのアクセスに失敗しました')
            }
        } catch (e: any) {
            console.error(e)
            alert('エラーが発生しました: ' + (e.message || 'Unknown error'))
        }
    }

    const handleCancel = async () => {
        if (!confirm('本当に解約しますか？\n解約すると期間終了後にFreeプランへダウングレードされます。')) return
        setIsActionLoading(true)
        const res = await cancelSubscription()
        setIsActionLoading(false)
        if (res.error) alert(res.error)
    }

    const handleResume = async () => {
        if (!confirm('解約を取り消して契約を継続しますか？')) return
        setIsActionLoading(true)
        const res = await resumeSubscription()
        setIsActionLoading(false)
        if (res.error) alert(res.error)
    }

    // Features mapping (hardcoded for UI display for now, or derived from plan_limits if available)
    const FEATURE_MAP: Record<string, string[]> = {
        'FREE': ['基本機能', 'メンバー5人まで', 'データ保存30日'],
        'STANDARD': ['基本機能', 'メンバー無制限', 'データ保存無制限', '優先サポート'],
        'PRO': ['全機能', '監査ログ', '専任サポート', 'AI機能無制限'],
        'ENTERPRISE': ['全機能', 'SLA保証', '専用インフラ', 'カスタマイズ開発']
    }

    const sortedPrices = [...prices].sort((a, b) => a.amount - b.amount)

    const plansWithPrice = sortedPrices.reduce((acc, price) => {
        if (price.interval !== interval) return acc
        acc.push(price)
        return acc
    }, [] as Price[])

    return (
        <div className="space-y-8">
            <div className="bg-white border text-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2 text-lg">
                        <CreditCard className="h-5 w-5 text-gray-500" />
                        プラン設定
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-200 rounded-lg p-1 text-sm">
                            <button
                                onClick={() => setInterval('month')}
                                className={`px-3 py-1 rounded-md transition-all ${interval === 'month' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                月払い
                            </button>
                            <button
                                onClick={() => setInterval('year')}
                                className={`px-3 py-1 rounded-md transition-all ${interval === 'year' ? 'bg-white shadow text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                年払い
                                <span className="ml-1 text-[10px] text-green-600 font-bold">お得!</span>
                            </button>
                        </div>
                        {currentPlan !== 'FREE' && (
                            <Button variant="outline" size="sm" onClick={handlePortal} className="hidden sm:flex items-center gap-1">
                                <CreditCard className="h-4 w-4" />
                                支払い情報の管理
                            </Button>
                        )}
                        <div className="text-xs text-gray-500 hidden sm:block">
                            現在のプラン: <span className="font-bold text-indigo-600">{currentPlan}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {plansWithPrice.length === 0 && (
                        <div className="col-span-3 text-center py-10 text-gray-500">
                            該当するプランがありません。
                        </div>
                    )}
                    {plansWithPrice.map((price) => {
                        const planName = price.plan_limits?.name || price.plan_id
                        const features = FEATURE_MAP[price.plan_id] || ['基本機能']
                        const isCurrent = currentPlan === price.plan_id
                        const isCampaign = !!price.campaign_code

                        return (
                            <div
                                key={price.id}
                                className={`border rounded-lg p-4 flex flex-col justify-between relative ${isCurrent ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/20' : 'border-gray-200 hover:border-indigo-300 transition-colors'} ${isCampaign ? 'border-yellow-400 bg-yellow-50/30' : ''}`}
                            >
                                {isCampaign && (
                                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-bl-lg">
                                        限定オファー
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-lg">{planName}</h3>
                                        {isCurrent && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">利用中</span>}
                                    </div>
                                    <div className="text-2xl font-bold mb-4">
                                        ¥{price.amount.toLocaleString()}
                                        <span className="text-sm text-gray-400 font-normal">/{price.interval === 'month' ? '月' : '年'}</span>
                                    </div>
                                    <ul className="space-y-2 mb-6">
                                        {features.map((feature, i) => (
                                            <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                                <Check className="h-3.5 w-3.5 text-green-500" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Button
                                    variant={isCurrent ? "outline" : "default"}
                                    disabled={isCurrent || isLoading !== null}
                                    onClick={() => handlePlanChange(price.id)}
                                    className={isCurrent ? "cursor-default opacity-50" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
                                >
                                    {isLoading === price.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (isCurrent ? '現在のプラン' : 'プラン変更')}
                                </Button>
                            </div>
                        )
                    })}
                </div>
                <p className="px-6 pb-6 text-xs text-gray-400 text-center">
                    ※ プラン変更は即時反映ではなく、営業担当の確認後に適用されます。
                </p>
            </div>

            {/* Contract Management Section */}
            {currentPlan !== 'FREE' && (
                <div className="bg-white border text-gray-800 rounded-xl shadow-sm overflow-hidden p-6">
                    <h3 className="font-bold text-lg mb-4">契約管理</h3>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                            <p className="font-bold">サブスクリプションのステータス</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {isCanceled
                                    ? '解約が予約されています。有効期限終了後にFreeプランへ移行します。'
                                    : '自動更新が有効です。次回更新日に自動的に決済されます。'}
                            </p>
                        </div>
                        <div>
                            {isCanceled ? (
                                <Button
                                    variant="outline"
                                    className="border-green-600 text-green-700 hover:bg-green-50"
                                    onClick={handleResume}
                                    disabled={isActionLoading}
                                >
                                    {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            解約を取り消して継続する
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={handleCancel}
                                    disabled={isActionLoading}
                                >
                                    {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                        <>
                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                            解約する
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
