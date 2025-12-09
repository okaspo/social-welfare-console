'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function archiveKnowledgeItem(id: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('knowledge_items')
            .update({
                is_active: false,
                archived_at: new Date().toISOString()
            })
            .eq('id', id)

        if (error) throw error

        revalidatePath('/admin/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Failed to archive item:', error)
        return { success: false, error: (error as Error).message }
    }
}
