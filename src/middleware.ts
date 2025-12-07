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

    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        // If config is missing, just proceed without Supabase auth
        // This allows the app to run in a "mock mode" or show configuration errors on the page
        return response
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

    // Route Protection Logic
    const url = request.nextUrl.clone()
    if (!user && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/admin'))) {
        // User is not logged in but trying to access protected routes
        url.pathname = '/login'
        return Response.redirect(url)
    }

    if (user && (url.pathname === '/login' || url.pathname === '/signup' || url.pathname === '/')) {
        // User is logged in but trying to access public/auth pages
        url.pathname = '/dashboard'
        return Response.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/ (API routes - generally managed by their own auth checks, or include if strict)
         * Use negative lookahead in regex
         */
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
}
