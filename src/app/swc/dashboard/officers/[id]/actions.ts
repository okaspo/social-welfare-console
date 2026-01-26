'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/logger'

export type ConcurrentPost = {
    id: string
    officer_id: string
    organization_name: string
    post_name: string
    organization_type?: string | null
    is_paid: boolean
    monthly_compensation?: number | null
    start_date: string
    end_date?: string | null
    notes?: string | null
}

export async function getConcurrentPosts(officerId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('officer_concurrent_posts')
        .select('*')
        .eq('officer_id', officerId)
        .order('start_date', { ascending: false })

    if (error) {
        console.error('Error fetching concurrent posts:', error)
        return []
    }

    return data as ConcurrentPost[]
}

export async function addConcurrentPost(officerId: string, formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        officer_id: officerId,
        organization_name: formData.get('organization_name') as string,
        post_name: formData.get('post_name') as string,
        organization_type: formData.get('organization_type') as string,
        is_paid: formData.get('is_paid') === 'on',
        monthly_compensation: formData.get('monthly_compensation') ? Number(formData.get('monthly_compensation')) : null,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') ? (formData.get('end_date') as string) : null,
        notes: formData.get('notes') as string,
    }

    const { error } = await supabase.from('officer_concurrent_posts').insert(rawData)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/swc/dashboard/officers/${officerId}`)
    return { success: true }
}

export async function deleteConcurrentPost(id: string, officerId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('officer_concurrent_posts').delete().eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/swc/dashboard/officers/${officerId}`)
    return { success: true }
}

export async function getOfficerDetails(id: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('officers').select('*').eq('id', id).single()
    return data
}

export async function createOfficer(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get Organization ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return { error: 'Organization not found' }

    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const email = formData.get('email') as string || null

    const inviteToSystem = formData.get('invite_to_system') === 'on'

    let userId: string | null = null

    // 1. Unified Identity: Try to link/create System User ONLY if email is provided AND explicitly requested
    if (email && inviteToSystem) {
        try {
            // Import Admin Client dynamically or ensure it is imported at top
            const { createAdminClient } = await import('@/lib/supabase/admin')
            const supabaseAdmin = await createAdminClient()

            // Check if user exists (by attempting create, or list - Create is safer/atomic)
            const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name: name }
            })

            if (authData.user) {
                userId = authData.user.id

                // Create Profile immediately
                await supabaseAdmin.from('profiles').insert({
                    id: userId,
                    full_name: name,
                    organization_id: profile.organization_id,
                    role: 'general', // Default to general member, can be promoted later
                    job_title: role // Sync Role to Job Title initially
                })
            } else if (authError?.message?.includes('already registered')) {
                // Fallback: If officer exists in system, we currently CANNOT get their ID easily without searching.
                // For legacy preservation/safety, we will proceed with NULL user_id but warn.
                // Or we could implement a lookup if we trust email match.
                console.warn(`User ${email} already exists. Creating unlinked officer record.`)
                // TODO: Future enhancement - Lookup user ID by email and link
            }
        } catch (e) {
            console.error('Failed to create system user for officer:', e)
            // Proceed as unlinked officer (Graceful degradation)
        }
    }

    const rawData = {
        organization_id: profile.organization_id,
        user_id: userId, // Link if created
        name: name,
        role: role,
        term_start_date: formData.get('term_start_date') as string,
        term_end_date: formData.get('term_end_date') as string,
        date_of_birth: formData.get('date_of_birth') as string || null,
        address: formData.get('address') as string || null,
        occupation: formData.get('occupation') as string || null,
        expertise_tags: formData.get('expertise_tags')
            ? (formData.get('expertise_tags') as string).split(',').map(s => s.trim())
            : [],
        email: email,
        updated_at: new Date().toISOString()
    }

    const { error } = await supabase.from('officers').insert(rawData)

    if (error) return { error: error.message }

    // Log Audit
    await logAudit('OFFICER_CREATE', `Officer created: ${rawData.name} (${rawData.role}) - Linked: ${!!userId}`, 'INFO')

    revalidatePath('/swc/dashboard/officers')
    return { success: true }
}

export async function updateOfficer(id: string, formData: FormData) {
    const supabase = await createClient()

    const rawData = {
        name: formData.get('name') as string,
        role: formData.get('role') as string,
        term_start_date: formData.get('term_start_date') as string,
        term_end_date: formData.get('term_end_date') as string,
        date_of_birth: formData.get('date_of_birth') as string || null,
        address: formData.get('address') as string || null,
        occupation: formData.get('occupation') as string || null,
        expertise_tags: formData.get('expertise_tags')
            ? (formData.get('expertise_tags') as string).split(',').map(s => s.trim())
            : [],
        email: formData.get('email') as string || null,
        updated_at: new Date().toISOString()
    }

    const { error } = await supabase.from('officers').update(rawData).eq('id', id)

    if (error) return { error: error.message }

    // Log Audit
    await logAudit('OFFICER_UPDATE', `Officer updated: ${rawData.name}`, 'INFO')

    revalidatePath(`/swc/dashboard/officers/${id}`)
    revalidatePath('/swc/dashboard/officers')
    return { success: true }
}

import { getAdminClient } from '@/lib/supabase/admin'

export async function deleteOfficer(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Verify Organization Perms
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return { error: 'Unauthorized' }

    // Use Admin Client to delete (in case of strict RLS)
    const supabaseAdmin = getAdminClient()

    // Optionally check if the officer belongs to the user's org before delete to be super safe,
    // though RLS or WHERE clause on delete usually handles it.
    // Here we simple do delete and assume ID is correct, or we can double check.

    const { error } = await supabaseAdmin
        .from('officers')
        .delete()
        .eq('id', id)
        .eq('organization_id', profile.organization_id) // Safety check: ensure deleting only own org's officer

    if (error) {
        console.error('Delete Officer Error:', error)
        return { error: error.message }
    }

    await logAudit('OFFICER_DELETE', `Officer removed: ${id}`, 'WARNING')

    revalidatePath('/swc/dashboard/officers')
    return { success: true }
}
