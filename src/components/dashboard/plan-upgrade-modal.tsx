'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Plan = 'FREE' | 'STANDARD' | 'PRO' | 'ENTERPRISE'

interface PlanUpgradeModalProps {
    currentPlan: Plan
    isOpen: boolean
    onClose: () => void
    onPlanUpdated: () => void
}

export default function PlanUpgradeModal({ currentPlan, isOpen, onClose, onPlanUpdated }: PlanUpgradeModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<Plan>(currentPlan)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    if (!isOpen) return null

    const handleUpgrade = async () => {
        if (selectedPlan === currentPlan) return

        // For Enterprise, show contact message
        if (selectedPlan === 'ENTERPRISE') {
            alert('エンタープライズプランへのお申し込みは、\nサポート窓口までお問い合わせください。')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Mock Update: In reality, this would call a payment provider (Stripe) checkout
            // Here we just verify the user and update the organization's plan directly via RPC or API
            // Since we don't have a direct API for this yet, let's use a server action or direct DB update (if RLS allows, but usually forbidden)
            // Ideally we use a server action. For prototype speed, I'll assume we have one or use a quick fetch to a new endpoint.
            // Let's assume we create a server action for this.

            const response = await fetch('/api/billing/update-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: selectedPlan })
            })

            if (!response.ok) throw new Error('Failed to update plan')

            onPlanUpdated()
            onClose()
            alert('プランを変更しました！')

        } catch (e) {
            console.error(e)
            setError('プラン変更に失敗しました。')
        } finally {
            setIsLoading(false)
        }
    }

    const plans = [
        { id: 'FREE', name: 'フリー', price: '¥0', features: ['基本機能', 'ユーザー1名'] },
        { id: 'STANDARD', name: 'スタンダード', price: '¥5,000', features: ['全機能アクセス', 'ユーザー1名', '優先サポート'] },
        { id: 'PRO', name: 'プロ', price: '¥20,000', features: ['全機能アクセス', 'マルチユーザー(5名)', '専任サポート'] },
        // Enterprise is separate
    ]

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">プラン変更・アップグレード</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 grid md:grid-cols-3 gap-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedPlan === plan.id
                                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                    : 'border-gray-200 hover:border-indigo-300'
                                }`}
                            onClick={() => setSelectedPlan(plan.id as Plan)}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-900">{plan.name}</h3>
                                {currentPlan === plan.id && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">現在</span>}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mb-4">{plan.price}<span className="text-sm font-normal text-gray-500">/月</span></div>
                            <ul className="space-y-2 text-sm text-gray-600 mb-4">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-gray-50 text-center">
                    <p className="text-sm text-gray-500 mb-4">
                        エンタープライズプラン（大規模法人向け）をご希望の場合は、お問い合わせください。
                    </p>
                    {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                    <button
                        onClick={handleUpgrade}
                        disabled={isLoading || selectedPlan === currentPlan}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? '処理中...' : selectedPlan === currentPlan ? '選択中のプランです' : 'プランを変更する'}
                    </button>
                </div>
            </div>
        </div>
    )
}
