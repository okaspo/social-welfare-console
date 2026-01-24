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

    const rawData = {
        organization_id: profile.organization_id,
        user_id: null, // No system user link for now
        name: formData.get('name') as string,
        role: formData.get('role') as string,
        term_start_date: formData.get('term_start_date') as string,
        term_end_date: formData.get('term_end_date') as string,
        expertise_tags: formData.get('expertise_tags')
            ? (formData.get('expertise_tags') as string).split(',').map(s => s.trim())
            : [],
        email: formData.get('email') as string || null,
        updated_at: new Date().toISOString()
    }

    const { error } = await supabase.from('officers').insert(rawData)

    if (error) return { error: error.message }

    // Log Audit
    await logAudit('OFFICER_CREATE', `Officer created: ${rawData.name} (${rawData.role})`, 'INFO')

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
