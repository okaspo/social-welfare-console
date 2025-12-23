import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BroadcastForm from '@/components/admin/broadcast-form'
import BroadcastHistoryList from '@/components/admin/broadcast-history-list'
import { Megaphone, History } from 'lucide-react'

export default async function BroadcastPage() {
    const supabase = await createClient()

    // 1. Auth Check (Super Admin Only)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .single()

    if (!adminRole) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>アクセス権限がありません (Super Admin Only)</p>
            </div>
        )
    }

    // 2. Fetch History
    const { data: history } = await supabase
        .from('admin_broadcasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-10 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Megaphone className="h-7 w-7 text-indigo-600" />
                    お知らせ一斉送信
                </h1>
                <p className="text-gray-500 mt-2">
                    登録ユーザーに対してメールを一斉送信します。
                    <br />
                    <span className="text-red-600 font-bold text-sm">※ 注意: 送信は取り消せません。必ずテスト送信を行ってから実行してください。</span>
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <BroadcastForm />
                    </div>
                </div>

                {/* Right: History */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-700">
                        <History className="h-5 w-5" />
                        最近の配信履歴
                    </h2>
                    <BroadcastHistoryList history={history || []} />
                </div>
            </div>
        </div>
    )
}
