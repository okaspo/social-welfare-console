'use client'

import { useState } from 'react'
import { Check, X, AlertCircle } from 'lucide-react'
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
        {
            id: 'FREE',
            name: 'フリー',
            price: '¥0',
            target: '個人・お試し',
            description: '機能体験のみ（Word出力不可）',
            features: ['WordDL不可(閲覧のみ)', '保存3件まで', 'AI議事録作成(体験)']
        },
        {
            id: 'STANDARD',
            name: 'スタンダード',
            price: '¥24,800',
            target: '小規模法人',
            description: '複合機リース代と同等。事務負担を軽減。',
            features: ['WordDL解禁', '作成月10件', '過去データ保存']
        },
        {
            id: 'PRO',
            name: 'プロ',
            price: '¥54,800',
            target: '中規模法人',
            description: '専門家顧問料以下。招集・法務リスク回避。',
            features: ['招集通知一括送信', '委任状自動生成', '高度な法務チェック', '規程AI学習']
        },
        {
            id: 'ENTERPRISE',
            name: 'エンタープライズ',
            price: '¥98,000',
            target: '大規模・グループ',
            description: '人件費の半額以下。事業報告完全自動化。',
            features: ['事業報告完全自動化', '現場入力機能', 'AI模擬監査', '複数施設管理']
        }
    ]

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">プラン変更・アップグレード</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all flex flex-col ${selectedPlan === plan.id
                                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                : 'border-gray-200 hover:border-indigo-300'
                                }`}
                            onClick={() => setSelectedPlan(plan.id as Plan)}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-900">{plan.name}</h3>
                                {currentPlan === plan.id && <span className="text-xs bg-gray-600 text-white px-2 py-0.5 rounded">現在</span>}
                            </div>
                            <div className="text-xl font-bold text-gray-900 mb-1">{plan.price}<span className="text-xs font-normal text-gray-500">/月</span></div>
                            <p className="text-xs text-indigo-600 font-medium mb-1">{plan.target}</p>
                            <p className="text-xs text-gray-500 mb-3 leading-tight font-bold">{(plan as any).description}</p>

                            <ul className="space-y-2 text-xs text-gray-600 mb-4 flex-1">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <Check className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-gray-50 text-center sticky bottom-0 border-t border-gray-100">
                    {error && <p className="text-red-600 text-sm mb-4"><AlertCircle className="inline h-4 w-4 mr-1" />{error}</p>}
                    <button
                        onClick={handleUpgrade}
                        disabled={isLoading || selectedPlan === currentPlan}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md w-full max-w-md"
                    >
                        {isLoading ? '処理中...' : selectedPlan === currentPlan ? '選択中のプランです' : 'プランを変更する'}
                    </button>
                    {selectedPlan === 'ENTERPRISE' && (
                        <p className="text-xs text-gray-500 mt-2">※エンタープライズプランはお問い合わせが必要です。</p>
                    )}
                </div>
            </div>
        </div>
    )
}
