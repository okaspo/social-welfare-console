import { getAdminStaff } from '@/lib/actions/admin-staff'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StaffList from '@/components/admin/staff-list'
import { ShieldCheck } from 'lucide-react'

export default async function AdminStaffPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify Admin Access
    const { data: adminRole, error: roleError } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', user.id)
        .single()

    if (!adminRole) {
        redirect('/swc/dashboard') // Not an admin
    }

    const staff = await getAdminStaff()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6" />
                    運営チーム管理
                </h1>
                <p className="text-gray-500 mt-1">
                    システムの運営・管理を行う内部スタッフの権限を管理します。
                    <span className="text-red-500 font-bold ml-1">※慎重に操作してください</span>
                </p>
            </div>

            <StaffList initialStaff={staff} currentUserRole={adminRole.role} />
        </div>
    )
}
