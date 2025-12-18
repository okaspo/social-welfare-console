import { createAdminClient } from '@/lib/supabase/admin'
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
        const supabase = await createAdminClient()

        // Fetch profiles with organization details
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                role,
                created_at,
                organization:organizations (
                    id,
                    name,
                    plan
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching users:", error)
        }
        users = (profiles || []) as any[]
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

            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">推定MRR (月次経常収益)</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                            ¥{users.reduce((acc, u) => {
                                const plan = u.organization?.plan || 'free';
                                if (plan === 'pro') return acc + 29800;
                                if (plan === 'standard') return acc + 9800;
                                return acc;
                            }, 0).toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">/月</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500">プラン内訳</h3>
                    <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span>Pro (¥29,800)</span>
                            <span className="font-bold">{users.filter(u => u.organization?.plan === 'pro').length} 社</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Standard (¥9,800)</span>
                            <span className="font-bold">{users.filter(u => u.organization?.plan === 'standard').length} 社</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Free</span>
                            <span>{users.filter(u => (u.organization?.plan || 'free') === 'free').length} 社</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center">
                    <div className="text-center">
                        <span className="block text-xs text-gray-500 mb-1">総ユーザー / 法人数</span>
                        <span className="font-bold text-2xl">{users.length}</span>
                        <div className="mt-2 text-xs text-green-600 font-medium bg-green-50 inline-block px-2 py-1 rounded">
                            今月: +{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Engagement Tools (Daily Tweets) */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Engagement Ops</h2>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold">Planned</span>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 mb-2">今日のAIツイート (下書き)</h3>
                        <p className="text-sm text-gray-600 italic">
                            "【社会福祉法人の皆様へ】2025年のIT導入補助金の公募が開始されました！今年度のポイントは「生産性向上」と「セキュリティ対策」。申請期限は8月末までです。 #社会福祉法人 #補助金 #DX"
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex-1 bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors shadow-sm">
                            Twitterへ投稿
                        </button>
                        <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                            再生成
                        </button>
                    </div>
                </div>
            </div>

            {/* Client Component for filtering/display */}
            <UserList initialUsers={users as any} />
        </div>
    )
}
