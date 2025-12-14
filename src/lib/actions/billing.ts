'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function changePlan(priceId: string) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 2. Get User's Organization
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return { error: 'No organization linked to user' }

    // 3. Verify Price & Get Plan
    const { data: priceData, error: priceError } = await supabase
        .from('plan_prices')
        .select('*, plan_limits(name)')
        .eq('id', priceId)
        .single()

    if (priceError || !priceData) {
        console.error("Price lookup error:", priceError)
        return { error: 'Invalid Price ID requested' }
    }

    // 4. Update Organization Plan
    // In a real system, we would create a Stripe subscription here.
    // For this prototype, we directly update the plan_id on the organization.
    const { error: updateError } = await supabase
        .from('organizations')
        .update({
            plan: priceData.plan_id,
            updated_at: new Date().toISOString()
        })
        .eq('id', profile.organization_id)

    if (updateError) {
        console.error("Plan update failed:", updateError)
        return { error: 'Failed to update organization plan' }
    }

    revalidatePath('/dashboard/settings') // covers /dashboard/settings/billing if nested layout
    revalidatePath('/dashboard/settings/billing')
    revalidatePath('/dashboard') // global nav might change

    return {
        success: true,
        planName: priceData.plan_limits?.name || priceData.plan_id
    }
}

export async function managePrice(formData: FormData) {
    const supabase = await createClient()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const planId = formData.get('planId') as string
    const amount = parseInt(formData.get('amount') as string)
    const interval = formData.get('interval') as 'month' | 'year'
    const campaignCode = formData.get('campaignCode') as string || null
    const isPublic = formData.get('isPublic') === 'true'

    if (!planId || isNaN(amount) || !interval) {
        return { error: 'Missing required fields' }
    }

    const priceData = {
        plan_id: planId,
        amount,
        interval,
        campaign_code: campaignCode || null,
        is_public: isPublic
    }

    let resultError;
    if (id) {
        const { error } = await supabase
            .from('plan_prices')
            .update(priceData)
            .eq('id', id)
        resultError = error
    } else {
        const { error } = await supabase
            .from('plan_prices')
            .insert(priceData)
        resultError = error
    }

    if (resultError) return { error: resultError.message }

    revalidatePath('/admin/plans')
    return { success: true }
}

export async function deletePrice(priceId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('plan_prices').delete().eq('id', priceId)
    if (error) return { error: error.message }

    revalidatePath('/admin/plans')
    return { success: true }
}
