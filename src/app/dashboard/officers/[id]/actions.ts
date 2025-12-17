'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

    revalidatePath(`/dashboard/officers/${officerId}`)
    return { success: true }
}

export async function deleteConcurrentPost(id: string, officerId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('officer_concurrent_posts').delete().eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/officers/${officerId}`)
    return { success: true }
}

export async function getOfficerDetails(id: string) {
    const supabase = await createClient()
    const { data } = await supabase.from('officers').select('*').eq('id', id).single()
    return data
}
