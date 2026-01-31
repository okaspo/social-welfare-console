import { requireSystemAdmin } from '@/lib/auth/admin-auth'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Check Role - strict check against admin_roles table
    await requireSystemAdmin()

    // Simple layout - child routes provide their own sidebars
    return <>{children}</>
}


