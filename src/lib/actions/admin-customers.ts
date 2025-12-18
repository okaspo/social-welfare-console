'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CustomerOrg {
    id: string
    name: string
    plan: string
    entity_type: string
    created_at: string
    owner_email?: string
    is_active: boolean
    custom_domain?: string | null
}

/**
 * Get all customer organizations
 */
export async function getCustomerOrgs() {
    const supabase = await createClient()

    const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

    if (error || !orgs) return []

    // Map to CustomerOrg interface
    // Ideally we fetch owner email too, but that requires joining profiles (via some "owner" role or first member check)
    // For efficiency, let's just return org data first.

    return orgs.map(org => ({
        id: org.id,
        name: org.name,
        plan: org.plan,
        entity_type: org.entity_type,
        created_at: org.created_at,
        is_active: true, // Placeholder logic
        custom_domain: org.custom_domain
    })) as CustomerOrg[]
}

/**
 * Update Organization Plan (Admin Override)
 */
export async function updateOrgPlan(orgId: string, newPlan: string) {
    // Permission check via RLS or explicit check?
    // The endpoint should only be accessible to Admins.
    // Safe to check `admin_roles` first.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: admin } = await supabase.from('admin_roles').select('role').eq('user_id', user.id).single()
    if (!admin) return { error: 'Permission Denied' }

    const { error } = await supabase
        .from('organizations')
        .update({ plan: newPlan })
        .eq('id', orgId)

    if (error) return { error: error.message }

    revalidatePath('/admin/customers')
    return { success: true }
}
