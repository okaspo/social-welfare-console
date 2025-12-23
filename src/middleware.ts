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
        console.log('[Middleware] Admin route accessed:', url.pathname);

        if (!user) {
            console.log('[Middleware] No user, redirecting to login');
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        console.log('[Middleware] User found:', user.id);

        // Check if user has admin role
        const { data: adminRole, error: adminError } = await supabase
            .from('admin_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (adminError) {
            console.error('[Middleware] Admin role check error:', adminError);
        }

        console.log('[Middleware] Admin role result:', adminRole);

        if (!adminRole) {
            // Unauthorized access to admin area
            console.log('[Middleware] No admin role, redirecting to swc dashboard');
            url.pathname = '/swc/dashboard'
            return NextResponse.redirect(url)
        }

        console.log('[Middleware] Admin access granted');
    }

    // 2. Dashboard Routes Protection
    if (url.pathname.startsWith('/swc/dashboard') || url.pathname.startsWith('/dashboard')) {
        if (!user) {
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Redirect legacy /dashboard to /swc/dashboard
        if (url.pathname.startsWith('/dashboard')) {
            url.pathname = url.pathname.replace('/dashboard', '/swc/dashboard')
            return NextResponse.redirect(url)
        }
    }

    // 3. Auth Routes (Redirect to dashboard if logged in)
    if (user && (url.pathname === '/login' || url.pathname === '/signup')) {
        url.pathname = '/swc/dashboard'
        return NextResponse.redirect(url)
    }

    // 4. Root Path (Redirect to dashboard if logged in)
    if (user && url.pathname === '/') {
        url.pathname = '/swc/dashboard'
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
         * - logout (logout route)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/|logout).*)',
    ],
}
