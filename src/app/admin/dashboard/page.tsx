import { createClient } from '@/lib/supabase/server'
import UserList from './user-list'

export default async function AdminDashboardPage() {
    let users = []
    let isMock = false

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        isMock = true
        // Mock data for demonstration/development
        users = [
            {
                id: '1',
                full_name: '山田 太郎',
                role: 'admin',
                created_at: new Date().toISOString(),
                organization: { name: '社会福祉法人 愛の光', plan: 'PRO' }
            },
            {
                id: '2',
                full_name: '鈴木 花子',
                role: 'user',
                created_at: new Date(Date.now() - 86400000).toISOString(),
                organization: { name: '社会福祉法人 希望', plan: 'STANDARD' }
            },
            {
                id: '3',
                full_name: '佐藤 次郎',
                role: 'user',
                created_at: new Date(Date.now() - 172800000).toISOString(),
                organization: { name: '社会福祉法人 未来', plan: 'FREE' }
            }
        ]
    } else {
        const supabase = await createClient()

        // Fetch profiles with organization details
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                role,
                created_at,
                organization:organizations (
                    name,
                    plan
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching users:", error)
        }
        users = profiles || []
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {isMock && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <span className="font-bold">⚠️ Mock Mode:</span>
                    Supabase credentials missing. Showing demonstration data.
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
                    <p className="text-sm text-gray-500 mt-1">登録されている社会福祉法人およびユーザーの一覧</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 border rounded-lg shadow-sm text-center">
                        <span className="block text-xs text-gray-500">総ユーザー</span>
                        <span className="font-bold text-xl">{users.length}</span>
                    </div>
                    <div className="bg-white px-4 py-2 border rounded-lg shadow-sm text-center">
                        <span className="block text-xs text-gray-500">今月の新規</span>
                        {/* Mock calculation for demo simplicity */}
                        <span className="font-bold text-xl text-green-600">+{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}</span>
                    </div>
                </div>
            </div>

            {/* Client Component for filtering/display */}
            <UserList initialUsers={users as any} />
        </div>
    )
}
