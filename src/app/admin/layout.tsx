import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check Role - must be admin, super_admin, or representative in profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const allowedRoles = ['super_admin', 'admin', 'representative'];
    if (!profile || !allowedRoles.includes(profile.role)) {
        redirect('/chat')
    }

    // Simple layout - child routes provide their own sidebars
    return <>{children}</>
}


