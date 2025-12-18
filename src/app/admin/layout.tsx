import { AdminSidebar } from '@/components/admin/admin-sidebar'
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

    // Check Role
    const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!adminRole) {
        redirect('/dashboard')
    }

    const currentUser = {
        email: user.email!,
        role: adminRole.role,
        name: user.user_metadata?.full_name
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar currentUser={currentUser} />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
