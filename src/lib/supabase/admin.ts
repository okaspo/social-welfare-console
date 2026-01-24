import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createAdminClient() {
    const cookieStore = await cookies()

    // Use Service Role Key for Admin Access (Bypass RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail.')
    }

    return createServerClient(
        supabaseUrl,
        supabaseServiceKey,
        {
            cookies: {
                getAll() {
                    return []
                },
                setAll(cookiesToSet) {
                    // Do nothing for admin client
                },
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            }
        }
    )
}

import { createClient } from '@supabase/supabase-js'

export function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}
