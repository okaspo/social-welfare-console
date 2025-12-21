import { getScopedOrganizations } from '@/lib/admin/scoped-queries';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Building2, Users, TrendingUp, Search, Filter, LogIn } from 'lucide-react';
import Link from 'next/link';

export default async function SwcCustomersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const allowedRoles = ['super_admin', 'admin', 'representative'];
    if (!profile || !allowedRoles.includes(profile.role)) {
        redirect('/chat');
    }

    // Fetch organizations with automatic entity_type='social_welfare' filter
    const organizations = await getScopedOrganizations({
        pathname: '/admin/swc/customers'
    });

    const planColors: Record<string, string> = {
        free: 'bg-gray-100 text-gray-700',
        standard: 'bg-blue-100 text-blue-700',
        pro: 'bg-purple-100 text-purple-700',
        enterprise: 'bg-amber-100 text-amber-700',
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Building2 className="h-4 w-4" />
                    <span>社会福祉法人コンソール</span>
                    <span>/</span>
                    <span>顧客管理</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
                <p className="text-gray-600 mt-1">
                    社会福祉法人のお客様を管理します
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-green-600">+3</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{organizations.length}</div>
                    <div className="text-xs text-gray-500">登録法人数</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Users className="h-4 w-4 text-purple-600" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {organizations.reduce((acc: number, org: any) =>
                            acc + (org.profiles?.length || 0), 0
                        )}
                    </div>
                    <div className="text-xs text-gray-500">総ユーザー数</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-amber-600" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {organizations.filter((o: any) => o.plan === 'pro' || o.plan === 'enterprise').length}
                    </div>
                    <div className="text-xs text-gray-500">有料プラン</div>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Filter className="h-4 w-4 text-gray-600" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">social_welfare</div>
                    <div className="text-xs text-gray-500">フィルター適用中</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">法人一覧</h2>
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="検索..."
                            className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">法人名</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">プラン</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー数</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {organizations.map((org: any) => (
                            <tr key={org.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{org.name}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${planColors[org.plan] || planColors.free}`}>
                                        {org.plan || 'free'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {org.profiles?.length || 0}人
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-sm">
                                    {new Date(org.created_at).toLocaleDateString('ja-JP')}
                                </td>
                                <td className="px-4 py-3">
                                    <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-100">
                                        <LogIn className="h-3 w-3" />
                                        詳細
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {organizations.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                                    社会福祉法人の登録がありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
