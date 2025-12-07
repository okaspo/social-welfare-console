
'use server'

import { createClient } from '@/lib/supabase/server'
import { Officer } from './data'

export async function getOfficers(): Promise<Officer[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('officers')
        .select('*')
        .order('term_expires_at', { ascending: true })

    if (error) {
        console.error('Error fetching officers:', error)
        return []
    }

    if (!data) return []

    // Map DB fields to Application Type
    return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        termStartDate: row.appointed_at,
        termEndDate: row.term_expires_at,
        status: row.active ? 'active' : 'expired' // Simple mapping, UI handles expiry logic too
    }))
}
