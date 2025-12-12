'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createMember(formData: FormData) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

    // 1. Verify Current User & Permissions
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if current user is admin of their org?
    // For now, assume any logged - in user can add members (simplified)
    // Realistically we should fetch their role from profiles.

    const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

    if (!requesterProfile?.organization_id) return { error: 'No organization found' }

    // 2. Extract Data
    const email = formData.get('email') as string
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as string || 'general'

    if (!email || !fullName) return { error: 'Email and Name are required' }

    // 3. Create Auth User (using Admin Client)
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!' // Simple temp password

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            corporation_name: 'Link to Org', // Placeholder
        }
    })

    if (authError) return { error: authError.message }

    const newUserId = authData.user.id

    // 4. Create Profile & Link to Org
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: newUserId,
            full_name: fullName,
            organization_id: requesterProfile.organization_id,
            role: role
        })

    if (profileError) {
        // Cleanup auth user if profile fails? 
        // For now just return error
        return { error: 'Profile creation failed: ' + profileError.message }
    }

    revalidatePath('/dashboard/organization')
    return { success: true, tempPassword, email }
}
