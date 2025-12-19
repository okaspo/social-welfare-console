import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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

                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })

                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
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

    // 1. Admin Routes Protection
    if (url.pathname.startsWith('/admin')) {
        if (!user) {
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Check if user has admin role
        const { data: adminRole } = await supabase
            .from('admin_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (!adminRole) {
            // Unauthorized access to admin area
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    // 2. Dashboard Routes Protection
    if (url.pathname.startsWith('/dashboard')) {
        if (!user) {
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    // 3. Auth Routes (Redirect to dashboard if logged in)
    if (user && (url.pathname === '/login' || url.pathname === '/signup')) {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // 4. Root Path (Redirect to dashboard if logged in)
    if (user && url.pathname === '/') {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
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
         * - api/ (API routes)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
}
