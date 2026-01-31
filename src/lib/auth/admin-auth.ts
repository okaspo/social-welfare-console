import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface SystemAdminProfile {
    id: string
    role: string // Should be 'super_admin' etc from admin_roles
    email?: string
}

/**
 * Enforces System Admin access.
 * Checks ONLY the admin_roles table.
 * Redirects to /swc/dashboard if authorized user is not found in admin_roles.
 */
export async function requireSystemAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Strictly check admin_roles table
    const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

    if (!adminRole) {
        // Log unauthorized access attempt logic here if needed
        console.warn(`Unauthorized access attempt to System Admin by user: ${user.id}`)
        redirect('/swc/dashboard')
    }

    return {
        user,
        role: adminRole.role
    }
}
