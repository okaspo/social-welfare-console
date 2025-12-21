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

    // Check Role - must have admin_roles entry
    const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!adminRole) {
        redirect('/dashboard')
    }

    // Simple layout - child routes provide their own sidebars
    return <>{children}</>
}

