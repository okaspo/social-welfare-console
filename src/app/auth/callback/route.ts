import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // The `next` param is already extracted above, so we can check if it exists and is clean.
            // Ensure `next` starts with / to avoid open redirect vulnerabilities
            const redirectUrl = next.startsWith('/') ? next : '/dashboard'
            return NextResponse.redirect(`${origin}${redirectUrl}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
