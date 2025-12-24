import { getScopedDashboardStats } from '@/lib/admin/scoped-queries';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Building2, BarChart3, Users, FileText, TrendingUp, BookOpen, MessageSquare, ShieldCheck, Mail } from 'lucide-react';
import Link from 'next/link';

export default async function SwcDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Stats
    const statsData = await getScopedDashboardStats({ pathname: '/admin/swc' });

    const stats = [
        { label: '登録法人数', value: statsData.organizationCount.toString(), change: '-', icon: Building2 },
        { label: '総ユーザー数', value: statsData.userCount.toString(), change: '-', icon: Users },
        { label: '今月の書類生成', value: '456', change: '+23%', icon: FileText }, // Placeholder as query not ready
        { label: '月間売上 (推定)', value: '¥1.8M', change: '+15%', icon: TrendingUp }, // Placeholder
    ];

    return (
        <div className="p-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
                <p className="text-gray-600">社会福祉法人向けサービスの状況</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white rounded-xl border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Icon className="h-5 w-5 text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-green-600">{stat.change}</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <div className="text-sm text-gray-500">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション (SWC)</h3>
                <div className="grid grid-cols-4 gap-4">
                    <Link href="/admin/swc/knowledge" className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left group">
                        <div className="p-2 bg-indigo-50 w-fit rounded-md mb-3 group-hover:bg-indigo-100">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="font-medium text-gray-900">ナレッジ管理</div>
                        <div className="text-sm text-gray-500">法令・ガイドラインを追加</div>
                    </Link>
                    <Link href="/admin/swc/prompts" className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left group">
                        <div className="p-2 bg-purple-50 w-fit rounded-md mb-3 group-hover:bg-purple-100">
                            <MessageSquare className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="font-medium text-gray-900">プロンプト管理</div>
                        <div className="text-sm text-gray-500">AIの応答調整</div>
                    </Link>
                    <Link href="/admin/swc/audit" className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left group">
                        <div className="p-2 bg-green-50 w-fit rounded-md mb-3 group-hover:bg-green-100">
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="font-medium text-gray-900">監査基準・ログ</div>
                        <div className="text-sm text-gray-500">監査ログと基準の管理</div>
                    </Link>
                    <Link href="/admin/marketing/broadcast" className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left group">
                        <div className="p-2 bg-orange-50 w-fit rounded-md mb-3 group-hover:bg-orange-100">
                            <Mail className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="font-medium text-gray-900">一斉メール配信</div>
                        <div className="text-sm text-gray-500">管理者向けお知らせ</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
