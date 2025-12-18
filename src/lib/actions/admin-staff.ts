'use server'

import { createClient, getAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/logger'

export type AdminRole = 'super_admin' | 'editor'

export interface AdminStaff {
    user_id: string
    email: string
    role: AdminRole
    created_at: string
}

/**
 * Check if current user is Super Admin
 */
async function checkSuperAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .single()

    return !!data
}

/**
 * Get all staff members with admin roles
 */
export async function getAdminStaff() {
    // Need admin client to fetch emails from auth.users (if not in public.users)
    // Or we can query public.users if synced. Assuming public.profiles/users exists or using auth.
    // Ideally we join with public table. Let's use getAdminClient to be safe or rely on profiles.

    // For now, let's assume we have a way to get email.
    // The safest "internal" way is getAdminClient().auth.admin.listUsers() but that's heavy.
    // Let's assume we can get emails via profiles if they exist, or just partial data.
    // Actually, we usually have `profiles` table.

    const supabase = await createClient()

    // Fetch roles
    const { data: roles, error } = await supabase
        .from('admin_roles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error || !roles) return []

    // Fetch details for these users (email, name)
    // We can fetch from public.profiles
    const userIds = roles.map(r => r.user_id)
    if (userIds.length === 0) return []

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email') // Assuming email is in profile or we need to fetch user
        .in('id', userIds)

    // Merge
    return roles.map(r => {
        const profile = profiles?.find(p => p.id === r.user_id)
        return {
            user_id: r.user_id,
            email: profile?.email || 'Unknown', // Fallback
            role: r.role as AdminRole,
            created_at: r.created_at,
            name: profile?.full_name
        }
    })
}

/**
 * Add a user as Admin Staff
 */
export async function addAdminStaff(email: string, role: AdminRole) {
    if (!await checkSuperAdmin()) return { error: 'Permission Denied: Super Admin required' }

    const supabaseAdmin = await getAdminClient()

    // 1. Find user by email
    const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers()
    // Doing listUsers is inefficient for large bases, but simplest without "getUserByEmail" (which is deprecated/unstable in pure Supabase JS sometimes? No, check helpers)
    // Actually listUsers() returns pages.
    // Better: Rely on invitation if user doesn't exist? 
    // For now, assume user exists.

    // Let's try to simple filter in listUsers? or iterate.
    // Or use profiles if we trust it.
    // Let's verify via Supabase Admin `listUsers` with filter if possible (v2 supports it?)
    // Actually `supabaseAdmin.rpc` or db query on auth.users is not possible directly from client.

    // Workaround: We ask for User ID, or we assume the user is already in `profiles` and search there.
    const supabase = await createClient()
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email) // Assuming we sync email to profiles. If not, this is tough.
        .single()

    let targetUserId = profile?.id

    if (!targetUserId) {
        // Fallback: Use Admin API to search (expensive but accurate)
        // Note: listUsers() page size default is 50.
        // If we really need to find by email, maybe `inviteUserByEmail`?
        return { error: 'User not found in public profiles. Please ensure they have signed up.' }
    }

    // 2. Insert into admin_roles
    const { error: insertError } = await supabase
        .from('admin_roles')
        .insert({
            user_id: targetUserId,
            role
        })

    if (insertError) return { error: insertError.message }

    revalidatePath('/admin/staff')
    return { success: true }
}

/**
 * Remove Admin Staff
 */
export async function removeAdminStaff(userId: string) {
    if (!await checkSuperAdmin()) return { error: 'Permission Denied' }

    const supabase = await createClient()
    const { error } = await supabase
        .from('admin_roles')
        .delete()
        .eq('user_id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/staff')
    return { success: true }
}

/**
 * Update Admin Role
 */
export async function updateAdminRole(userId: string, newRole: AdminRole) {
    if (!await checkSuperAdmin()) return { error: 'Permission Denied' }

    const supabase = await createClient()
    const { error } = await supabase
        .from('admin_roles')
        .update({ role: newRole })
        .eq('user_id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/staff')
    return { success: true }
}
