'use server'

import { createClient } from '@/lib/supabase/server'
import { getURL } from '@/lib/get-url'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const supabase = await createClient()

    // Construct the explicit callback URL
    // getURL() returns a normalized URL without trailing slash (e.g. https://site.com)
    const emailRedirectTo = `${getURL()}/auth/callback?next=/swc/dashboard`

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo,
        },
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
