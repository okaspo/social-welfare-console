'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2, CreditCard } from 'lucide-react'
import { changePlan } from '@/lib/actions/billing'

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
    prices
}: {
    currentPlan: string,
    prices: Price[]
}) {
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [interval, setInterval] = useState<'month' | 'year'>('month')

    const handlePlanChange = async (priceId: string) => {
        setIsLoading(priceId)
        try {
            const result = await changePlan(priceId)
            if (result.error) {
                alert(result.error)
            } else {
                alert(`プランを変更しました: ${result.planName}`)
                // In a real app we might router.refresh() here, but server action revalidates path.
            }
        } catch (error) {
            console.error(error)
            alert('エラーが発生しました')
        } finally {
            setIsLoading(null)
        }
    }

    // Features mapping (hardcoded for UI display for now, or derived from plan_limits if available)
    // Since plan_limits.features is JSON, we might need a parser. For now let's map by plan_id.
    const FEATURE_MAP: Record<string, string[]> = {
        'FREE': ['基本機能', 'メンバー5人まで', 'データ保存30日'],
        'STANDARD': ['基本機能', 'メンバー無制限', 'データ保存無制限', '優先サポート'],
        'PRO': ['全機能', '監査ログ', '専任サポート', 'AI機能無制限'],
        'ENTERPRISE': ['全機能', 'SLA保証', '専用インフラ', 'カスタマイズ開発']
    }

    // Sort prices: Standard -> Pro -> Enterprise?
    // We can just rely on the order passed or sort by amount.
    const sortedPrices = [...prices].sort((a, b) => a.amount - b.amount)

    // Filter by interval
    // But also we need to group by Plan?
    // If I have Standard Monthly and Standard Yearly.
    // I want to show "Standard" card.
    // If interval is 'month', show monthly price.
    // If interval is 'year', show yearly price.

    // Group prices by plan_id
    const plansWithPrice = sortedPrices.reduce((acc, price) => {
        if (price.interval !== interval) return acc

        // If multiple prices exist for same plan/interval (e.g. campaign), 
        // usually we show the cheapest or the one matching campaign code?
        // The server filters 'is_public' or 'campaign matches'.
        // If both public and campaign exist for same plan?
        // Let's assume server passes what should be visible.
        // If both present, we might show both or just the campaign one if it overrides?
        // Let's show all available cards.

        acc.push(price)
        return acc
    }, [] as Price[])

    return (
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
    )
}
