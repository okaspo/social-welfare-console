import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired' | null

export interface SubscriptionCheckResult {
    plan: 'free' | 'standard' | 'pro'
    status: SubscriptionStatus
    isGracePeriod: boolean
}

/**
 * Checks the subscription status of an organization and performs necessary downgrades or updates.
 * This is a "Lazy Check" intended to be run on user session initialization or critical actions.
 */
export async function checkSubscriptionStatus(organizationId: string): Promise<SubscriptionCheckResult> {
    const supabase = await createClient()

    const { data: org, error } = await supabase
        .from('organizations')
        .select('plan, subscription_status, current_period_end, grace_period_end')
        .eq('id', organizationId)
        .single()

    if (error || !org) {
        console.error("Failed to fetch organization for subscription check", error)
        return { plan: 'free', status: null, isGracePeriod: false }
    }

    const now = new Date()
    const currentPeriodEnd = org.current_period_end ? new Date(org.current_period_end) : null
    const gracePeriodEnd = org.grace_period_end ? new Date(org.grace_period_end) : null

    // Logic 1: Grace Period check
    // If status is past_due/unpaid BUT we are within grace period, treat as active (warn in UI)
    if ((org.subscription_status === 'past_due' || org.subscription_status === 'unpaid') && gracePeriodEnd && now < gracePeriodEnd) {
        return {
            plan: org.plan,
            status: org.subscription_status,
            isGracePeriod: true
        }
    }

    // Logic 2: Hard Expiration / Downgrade
    // If period has ended AND it implies expiration (e.g. cancelled or unpaid past grace)
    // OR if status is explicitly canceled/unpaid
    // Note: 'canceled' status in Stripe usually means "at end of period".
    // If current_period_end is passed, we downgrade.

    let shouldDowngrade = false

    // Condition A: Explicitly bad status with no grace period remaining
    const badStatus = ['canceled', 'unpaid', 'past_due'].includes(org.subscription_status)
    if (badStatus && (!gracePeriodEnd || now > gracePeriodEnd)) {
        // However, we must respect current_period_end even if status is 'canceled' (scheduled for cancellation)
        // But if status is 'canceled' in Stripe, it officially means it's DONE. 
        // 'active' + cancel_at_period_end is the "scheduled" state.
        // 'canceled' means it's over.
        shouldDowngrade = true
    }

    // Condition B: Time based expiration
    // If we have a generic period end and we passed it, and we assume we shouldn't be active anymore
    // (This is a fallback if Webhooks fail to update status to 'canceled')
    if (currentPeriodEnd && now > currentPeriodEnd) {
        // Only downgrade if we are not in a valid grace period (already checked above, but safe to double check)
        if (!gracePeriodEnd || now > gracePeriodEnd) {
            shouldDowngrade = true
        }
    }

    if (shouldDowngrade && org.plan !== 'free') {
        await downgradeToFree(organizationId)
        return { plan: 'free', status: 'canceled', isGracePeriod: false }
    }

    return {
        plan: org.plan,
        status: org.subscription_status,
        isGracePeriod: false
    }
}

export async function downgradeToFree(organizationId: string) {
    const supabase = await createClient()

    console.log(`[Subscription] Downgrading organization ${organizationId} to Free plan.`)

    const { error } = await supabase
        .from('organizations')
        .update({
            plan: 'free',
            subscription_status: 'canceled', // Or 'unpaid' depending on context, but 'canceled' is safe for free
            updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)

    if (error) {
        console.error("Failed to downgrade organization:", error)
    }

    // Invalidate cache to reflect changes immediately
    revalidatePath('/')
}
