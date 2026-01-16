'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import PlanUpgradeModal from '@/components/swc/dashboard/plan-upgrade-modal'
import { useRouter } from 'next/navigation'

export function AccountHeader({ plan }: { plan: string }) {
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
    const router = useRouter()

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">設定</h1>

                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${plan === 'PRO' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        plan === 'STANDARD' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            plan === 'ENTERPRISE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                        {plan}プラン
                    </span>
                </div>

                <button
                    onClick={() => setIsUpgradeOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full hover:shadow-md transition-all"
                >
                    <Sparkles className="h-3 w-3" />
                    プラン変更・アップグレード
                </button>
            </div>
            <p className="text-gray-500 text-sm mt-1">
                アカウント情報や法人設定の管理。
            </p>

            <PlanUpgradeModal
                currentPlan={plan as any}
                isOpen={isUpgradeOpen}
                onClose={() => setIsUpgradeOpen(false)}
                onPlanUpdated={() => {
                    setIsUpgradeOpen(false)
                    router.refresh()
                }}
            />
        </div>
    )
}
