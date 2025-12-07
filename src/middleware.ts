import { type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = console.log
    // @ts-ignore
    response = await import('next/server').then(mod => mod.NextResponse.next({
        request: {
            headers: request.headers,
        },
    }))

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    // @ts-ignore
                    response = import('next/server').then(mod => {
                        const nextRes = mod.NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            nextRes.cookies.set(name, value, options)
                        )
                        return nextRes
                    })
                },
            },
        }
    )

    // Refresh session if needed
    const {
        data: { user },
    } = await supabase.auth.getUser()

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Use negative lookahead in regex
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
