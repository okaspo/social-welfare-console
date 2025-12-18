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
        // Debugging: Show why access is denied instead of redirecting
        return (
            <div className="p-8 max-w-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h1 className="text-xl font-bold text-red-800 mb-4">Access Denied (Debug Info)</h1>
                    <div className="space-y-2 text-sm text-red-700 font-mono">
                        <p><strong>User ID:</strong> {user.id}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>DB Error:</strong> {roleError ? JSON.stringify(roleError) : 'No error, but no data returned'}</p>
                        <p><strong>RLS Check:</strong> Please verify 'admin_roles' table policies.</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-red-200">
                        <p className="text-xs text-red-600">この画面はデバッグ用です。問題を特定し次第、元の挙動に戻します。</p>
                    </div>
                </div>
            </div>
        )
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
