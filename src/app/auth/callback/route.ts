import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/swc/dashboard'

    if (code) {
        try {
            const supabase = await createClient()
            const { error } = await supabase.auth.exchangeCodeForSession(code)

            if (!error) {
                const redirectUrl = next.startsWith('/') ? next : '/swc/dashboard'
                return NextResponse.redirect(`${origin}${redirectUrl}`)
            }

            console.error('Auth code exchange failed:', error)
        } catch (err) {
            console.error('Auth callback error:', err)
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
