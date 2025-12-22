import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    // Fallback if env vars are missing to prevent crash
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

/**
 * Create Supabase client for API routes using Request headers
 * This is more reliable for Next.js 16+ API routes
 */
export function createClientFromRequest(request: Request) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

    // Parse cookies from request headers
    const cookieHeader = request.headers.get('cookie') || ''
    const cookiesMap = new Map<string, string>()

    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.trim().split('=')
        if (name) {
            cookiesMap.set(name, rest.join('='))
        }
    })

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return Array.from(cookiesMap.entries()).map(([name, value]) => ({
                        name,
                        value
                    }))
                },
                setAll() {
                    // API routes typically don't set cookies in the response
                },
            },
        }
    )
}

export function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    return createServerClient(
        supabaseUrl,
        serviceRoleKey,
        {
            cookies: {
                getAll() { return [] },
                setAll() { }
            }
        }
    )
}
