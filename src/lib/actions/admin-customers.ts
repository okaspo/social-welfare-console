'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CustomerOrg {
    id: string
    name: string
    plan: string
    entity_type: string
    status: string // e.g. 'active', 'suspended'
    created_at: string
    owner_name?: string
    owner_email?: string
    last_sign_in_at?: string
    custom_domain?: string | null
}

/**
 * Get all customer organizations with Owner details
 */
export async function getAdminCustomers() {
    const supabase = await createClient()

    // 1. Fetch Organizations
    const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

    if (error || !orgs) return []

    // 2. Fetch Owners (members with role='owner')
    // We need to match org_id.
    const orgIds = orgs.map(o => o.id)
    const { data: owners } = await supabase
        .from('organization_members')
        .select('organization_id, user_id')
        .eq('role', 'owner')
        .in('organization_id', orgIds)

    // 3. Fetch Profiles/Users for those owners
    const userIds = owners?.map(o => o.user_id) || []

    // We try to fetch from 'profiles' first (assuming it has email synced or we join auth).
    // If profiles doesn't have email, we might need to rely on what we have.
    // Based on previous files, profiles seems to have 'email', 'full_name'.
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, updated_at') // updated_at as proxy for activity? or we need auth.users
        .in('id', userIds)

    // 4. Merge Data
    return orgs.map(org => {
        const ownerMember = owners?.find(m => m.organization_id === org.id)
        const profile = profiles?.find(p => p.id === ownerMember?.user_id)

        return {
            id: org.id,
            name: org.name,
            plan: org.plan,
            entity_type: org.entity_type,
            status: org.subscription_status || 'active', // Fallback
            created_at: org.created_at,
            owner_name: profile?.full_name || 'Unknown',
            owner_email: profile?.email || 'Unknown',
            last_sign_in_at: profile?.updated_at, // Using updated_at as a proxy for now
            custom_domain: org.custom_domain
        }
    }) as CustomerOrg[]
}

/**
 * Update Organization (Admin Override)
 */
export async function updateOrganizationAdmin(orgId: string, data: { name: string, plan: string, status: string }) {
    const supabase = await createClient()

    // Check Super Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const { data: admin } = await supabase.from('admin_roles').select('role').eq('user_id', user.id).single()
    if (!admin || admin.role !== 'super_admin') return { error: 'Permission Denied: Super Admin required' }

    const { error } = await supabase
        .from('organizations')
        .update({
            name: data.name,
            plan: data.plan,
            subscription_status: data.status, // improving mapping
            updated_at: new Date().toISOString()
        })
        .eq('id', orgId)

    if (error) return { error: error.message }

    revalidatePath('/admin/customers')
    return { success: true }
}
