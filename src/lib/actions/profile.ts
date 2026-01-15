'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Extract form data
    const full_name = formData.get('full_name') as string
    const job_title = formData.get('job_title') as string
    const age_group = formData.get('age_group') as string | null
    const gender = formData.get('gender') as string | null

    // Validate required fields
    if (!full_name) {
        return { error: '表示名は必須です' }
    }

    // Update profile
    const { error } = await supabase
        .from('profiles')
        .update({
            full_name,
            job_title,
            age_group: age_group || null,
            gender: gender || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        console.error('Profile update error:', error)
        return { error: 'プロフィールの更新に失敗しました' }
    }

    revalidatePath('/swc/dashboard/settings/profile')
    return { success: true }
}
