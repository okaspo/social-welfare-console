'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function sendPasswordResetEmail(email: string) {
    if (!email) return { error: 'Email is required' }

    const supabase = await createAdminClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/update-password` : 'http://localhost:3000/update-password',
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
