import { getAdminCustomers } from '@/lib/actions/admin-customers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomerList from '@/components/admin/customer-list'
import { Users } from 'lucide-react'

export default async function AdminCustomersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify Admin Access
    const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!adminRole) {
        redirect('/dashboard')
    }

    const orgs = await getAdminCustomers()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    顧客・法人管理
                </h1>
                <p className="text-gray-500 mt-1">
                    サービスを利用している全ての法人組織（テナント）を管理します。
                </p>
            </div>

            <CustomerList initialOrgs={orgs} />
        </div>
    )
}
