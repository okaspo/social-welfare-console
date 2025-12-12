
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Building2, Calendar, MapPin, Phone } from 'lucide-react'
import AddMemberModal from '@/components/organization/add-member-modal'

export default async function OrganizationPage() {
    const supabase = await createClient()

    // 1. Get Current User
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        redirect('/login')
    }

    // 2. Get Profile with Organization
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
            *,
            organization:organizations (*)
        `)
        .eq('id', user.id)
        .single()

    if (profileError || !profile?.organization) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    <h3 className="font-bold">組織情報の取得に失敗しました</h3>
                    <p className="text-sm mt-1">
                        プロフィールまたは組織データが見つかりません。管理者にお問い合わせください。
                        <br />
                        Debug: {profileError?.message || 'No Organization Linked'}
                    </p>
                </div>
            </div>
        )
    }

    const org = profile.organization

    // 3. Get All Members of this Organization
    const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: true })

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                    組織情報管理
                </h1>
                <p className="text-sm text-gray-500 mt-1">所属する社会福祉法人の情報とメンバーを確認できます。</p>
            </div>

            {/* Organization Info Card */}
            <div className="bg-white border text-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="font-bold text-lg">{org.name}</h2>
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold border border-indigo-200">
                        {org.plan} PLAN
                    </span>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">住所</label>
                                <div className="mt-1">{org.address || '未設定'}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">電話番号</label>
                                <div className="mt-1">{org.phone || '未設定'}</div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">設立日</label>
                                <div className="mt-1">{org.establishment_date || '未設定'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members List */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-600" />
                        メンバー一覧
                    </h2>
                    <AddMemberModal />
                </div>

                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                        <tr>
                            <th className="px-6 py-3">名前</th>
                            <th className="px-6 py-3">役割</th>
                            <th className="px-6 py-3">登録日</th>
                            <th className="px-6 py-3 text-right">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {members?.map((member: any) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 font-medium text-gray-900">
                                    {member.full_name || '名称未設定'}
                                    {member.id === user.id && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">あなた</span>}
                                </td>
                                <td className="px-6 py-3">
                                    {(member.role === 'admin' || member.role === 'representative') ?
                                        <span className="text-indigo-600 font-medium">管理者</span> :
                                        <span>一般</span>
                                    }
                                </td>
                                <td className="px-6 py-3">{new Date(member.created_at).toLocaleDateString('ja-JP')}</td>
                                <td className="px-6 py-3 text-right">
                                    {/* Actions for admins */}
                                    <button className="text-indigo-600 hover:underline text-xs">詳細</button>
                                </td>
                            </tr>
                        ))}
                        {(!members || members.length === 0) && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                    メンバーが見つかりません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
