import { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Link } from 'lucide-react' // Wait, importing Link from lucide? No.
import NextLink from 'next/link'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { checkSubscriptionStatus } from '@/lib/subscription'

interface PlanGateProps {
    children: ReactNode
    plan: 'standard' | 'pro'
    fallback?: ReactNode
}

/**
 * A server component that selectively renders children based on the organization's plan.
 * If the user's plan is insufficient, it renders the fallback or a default lock message.
 */
export async function PlanGate({ children, plan: requiredPlan, fallback }: PlanGateProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return null

    // Check effective plan status (including grace period calculations)
    const { plan: currentPlan, status } = await checkSubscriptionStatus(profile.organization_id)

    const hierarchy = { free: 0, standard: 1, pro: 2 }
    const currentLevel = hierarchy[currentPlan] || 0
    const requiredLevel = hierarchy[requiredPlan] || 0

    // If plan is higher or equal, render children
    // Exception: If status is canceled (actually expired), the checkSubscriptionStatus would have returned 'free' anyway.
    if (currentLevel >= requiredLevel) {
        return <>{children}</>
    }

    if (fallback) {
        return <>{fallback}</>
    }

    // Default Fallback: Locked State
    return (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-gray-50 text-center space-y-4">
            <div className="p-3 bg-gray-100 rounded-full">
                <Lock className="w-6 h-6 text-gray-500" />
            </div>
            <div>
                <h3 className="text-lg font-medium text-gray-900">この機能は{requiredPlan === 'pro' ? 'Pro' : 'Standard'}プランで利用可能です</h3>
                <p className="text-sm text-gray-500 mt-1">
                    過去のデータは閲覧できますが、新規作成や編集を行うにはプランのアップグレードが必要です。
                </p>
            </div>
            <Button asChild variant="outline">
                <NextLink href="/dashboard/settings/billing">
                    プランを確認する
                </NextLink>
            </Button>
        </div>
    )
}
