'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function sendPasswordResetEmail(email: string) {
    if (!email) return { error: 'Email is required' }

    const supabase = await createAdminClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/update-password` : 'http://localhost:3000/update-password',
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function forceUpdatePlan(organizationId: string, newPlan: string) {
    const supabase = await createAdminClient()

    // Update organization plan
    const { error } = await supabase
        .from('organizations')
        .update({
            plan: newPlan,
            // If forcing a plan change, we usually want to reset subscription status to 'active' or similar to avoid immediate blocks
            // But be careful if this overrides Stripe status. For manual override, we might assume it's an internal grant.
            subscription_status: 'active',
            updated_at: new Date().toISOString()
        })
        .eq('id', organizationId)

    if (error) {
        return { error: error.message }
    }

    // Log the manual change
    await supabase.from('audit_logs').insert({
        organization_id: organizationId,
        action: 'ADMIN_PLAN_OVERRIDE',
        details: { new_plan: newPlan },
        timestamp: new Date().toISOString()
    })

    revalidatePath('/admin/dashboard')
    return { success: true }
}

export async function impersonateUser(userId: string) {
    const supabase = await createAdminClient()

    const { data: { user }, error: fetchError } = await supabase.auth.admin.getUserById(userId)
    if (fetchError || !user || !user.email) {
        return { error: 'User not found or no email' }
    }

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email,
        options: {
            redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/swc/dashboard'
        }
    })

    if (error) {
        return { error: error.message }
    }

    // Log the impersonation
    await supabase.from('audit_logs').insert({
        action: 'ADMIN_IMPERSONATE',
        details: { target_user_id: userId, target_email: user.email },
        timestamp: new Date().toISOString()
    })

    return { url: data.properties.action_link }
}
