'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save, RotateCcw, Shield } from 'lucide-react'
import { updatePlanLimits } from '@/lib/actions/billing' // We might need to implement this action if missing
import { Badge } from '@/components/ui/badge'

type PlanLimit = {
    plan_id: string
    max_users: number
    monthly_chat_limit: number
    monthly_doc_gen_limit: number
    storage_limit_mb: number
    features: Record<string, boolean>
}

// Plan definitions for display
const PLAN_META: Record<string, { name: string; color: string }> = {
    free: { name: 'Free', color: 'bg-gray-100 text-gray-800' },
    standard: { name: 'Standard', color: 'bg-blue-100 text-blue-800' },
    pro: { name: 'Pro', color: 'bg-purple-100 text-purple-800' },
    enterprise: { name: 'Enterprise', color: 'bg-amber-100 text-amber-800' },
}

export default function AdminPlanEditor({ initialPlans }: { initialPlans: PlanLimit[] }) {
    const [plans, setPlans] = useState<PlanLimit[]>(initialPlans)
    const [isLoading, setIsLoading] = useState(false)
    const [changedInfo, setChangedInfo] = useState<Set<string>>(new Set())

    const handleChange = (planId: string, field: keyof PlanLimit | 'features', value: any, featureKey?: string) => {
        setPlans(prev => prev.map(p => {
            if (p.plan_id !== planId) return p

            let newPlan = { ...p }
            if (field === 'features' && featureKey) {
                newPlan.features = {
                    ...p.features,
                    [featureKey]: value
                }
            } else if (field !== 'features') {
                // @ts-ignore
                newPlan[field] = value
            }
            return newPlan
        }))
        setChangedInfo(prev => new Set(prev).add(planId))
    }

    const handleSave = async (planId: string) => {
        const plan = plans.find(p => p.plan_id === planId)
        if (!plan) return

        setIsLoading(true)
        try {
            // Need to implement this action or verify if it exists
            const formData = new FormData()
            formData.append('planId', plan.plan_id)
            formData.append('maxUsers', plan.max_users.toString())
            formData.append('chatLimit', plan.monthly_chat_limit.toString())
            formData.append('docLimit', plan.monthly_doc_gen_limit.toString())
            formData.append('storageLimit', plan.storage_limit_mb?.toString() || '0')
            formData.append('features', JSON.stringify(plan.features))

            // Assuming updatePlanLimits exists in billing actions
            // If not, we will need to create it.
            // For now, I'll alert.
            await updatePlanLimits(formData)

            setChangedInfo(prev => {
                const next = new Set(prev)
                next.delete(planId)
                return next
            })
            alert('保存しました')
        } catch (e: any) {
            alert('Error: ' + e.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            {['free', 'standard', 'pro', 'enterprise'].map(planKey => {
                const plan = plans.find(p => p.plan_id === planKey)
                const meta = PLAN_META[planKey]
                if (!plan) return null

                const isChanged = changedInfo.has(planKey)

                return (
                    <div key={planKey} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className={meta.color}>{meta.name}</Badge>
                                <span className="text-sm text-gray-500 font-mono">ID: {plan.plan_id}</span>
                            </div>
                            <Button
                                onClick={() => handleSave(planKey)}
                                disabled={!isChanged || isLoading}
                                size="sm"
                                className={isChanged ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                変更を保存
                            </Button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Quotas */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Shield className="h-4 w-4" /> 制限設定
                                </h4>
                                <div>
                                    <Label className="text-xs">最大ユーザー数</Label>
                                    <Input
                                        type="number"
                                        value={plan.max_users}
                                        onChange={(e) => handleChange(planKey, 'max_users', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">月間チャット数 (-1=無制限)</Label>
                                    <Input
                                        type="number"
                                        value={plan.monthly_chat_limit}
                                        onChange={(e) => handleChange(planKey, 'monthly_chat_limit', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">月間ドキュメント生成 (-1=無制限)</Label>
                                    <Input
                                        type="number"
                                        value={plan.monthly_doc_gen_limit}
                                        onChange={(e) => handleChange(planKey, 'monthly_doc_gen_limit', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">ストレージ容量 (MB)</Label>
                                    <Input
                                        type="number"
                                        value={plan.storage_limit_mb || 0}
                                        onChange={(e) => handleChange(planKey, 'storage_limit_mb', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* Features */}
                            <div className="md:col-span-2 lg:col-span-3 space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4" /> 機能フラグ
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(plan.features || {}).map(([featureKey, enabled]) => (
                                        <div key={featureKey} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/[0.5]">
                                            <Label className="text-xs font-mono cursor-pointer" htmlFor={`${planKey}-${featureKey}`}>
                                                {featureKey}
                                            </Label>
                                            <Switch
                                                id={`${planKey}-${featureKey}`}
                                                checked={enabled as boolean}
                                                onCheckedChange={(c) => handleChange(planKey, 'features', c, featureKey)}
                                            />
                                        </div>
                                    ))}
                                    {/* Add feature button logic could go here */}
                                </div>
                                <div className="text-xs text-gray-400 mt-2">
                                    ※ 機能フラグの追加はエンジニアに依頼してください（DB定義が必要です）
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
