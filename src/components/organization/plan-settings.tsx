'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, Loader2, CreditCard } from 'lucide-react'

// Dummy plan data
const PLANS = [
    { id: 'FREE', name: 'Free', price: '¥0', features: ['基本機能', 'メンバー5人まで', 'データ保存30日'] },
    { id: 'STANDARD', name: 'Standard', price: '¥24,800', features: ['基本機能', 'メンバー無制限', 'データ保存無制限', '優先サポート'] },
    { id: 'PRO', name: 'Professional', price: '¥54,800', features: ['全機能', '監査ログ', '専任サポート', 'AI機能無制限'] },
    { id: 'ENTERPRISE', name: 'Enterprise', price: '¥98,000', features: ['全機能', 'SLA保証', '専用インフラ', 'カスタマイズ開発'] },
]

export default function PlanSettings({ currentPlan }: { currentPlan: string }) {
    const [isLoading, setIsLoading] = useState<string | null>(null)

    // For now, this is a distinct mock action
    const handlePlanChange = async (planId: string) => {
        setIsLoading(planId)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsLoading(null)
        alert('プラン変更のリクエストを受け付けました。担当者よりご連絡いたします。')
    }

    return (
        <div className="bg-white border text-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    プラン設定
                </h2>
                <div className="text-xs text-gray-500">
                    現在のプラン: <span className="font-bold text-indigo-600">{currentPlan}</span>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className={`border rounded-lg p-4 flex flex-col justify-between ${currentPlan === plan.id ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/20' : 'border-gray-200 hover:border-indigo-300 transition-colors'}`}
                    >
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-lg">{plan.name}</h3>
                                {currentPlan === plan.id && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">利用中</span>}
                            </div>
                            <div className="text-2xl font-bold mb-4">{plan.price}<span className="text-sm text-gray-400 font-normal">/月</span></div>
                            <ul className="space-y-2 mb-6">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Button
                            variant={currentPlan === plan.id ? "outline" : "default"}
                            disabled={currentPlan === plan.id || isLoading !== null}
                            onClick={() => handlePlanChange(plan.id)}
                            className={currentPlan === plan.id ? "cursor-default opacity-50" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
                        >
                            {isLoading === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (currentPlan === plan.id ? '現在のプラン' : 'プラン変更')}
                        </Button>
                    </div>
                ))}
            </div>
            <p className="px-6 pb-6 text-xs text-gray-400 text-center">
                ※ プラン変更は即時反映ではなく、営業担当の確認後に適用されます。
            </p>
        </div>
    )
}
