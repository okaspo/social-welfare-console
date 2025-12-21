import { Building2, BarChart3, Users, FileText, TrendingUp } from 'lucide-react';

export default function SwcDashboardPage() {
    const stats = [
        { label: '登録法人数', value: '87', change: '+12%', icon: Building2 },
        { label: 'アクティブユーザー', value: '1,234', change: '+8%', icon: Users },
        { label: '今月の書類生成', value: '456', change: '+23%', icon: FileText },
        { label: '月間売上', value: '¥1.8M', change: '+15%', icon: TrendingUp },
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
                <div className="grid grid-cols-3 gap-4">
                    <button className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left">
                        <div className="font-medium text-gray-900">ナレッジ追加</div>
                        <div className="text-sm text-gray-500">法令・ガイドラインを追加</div>
                    </button>
                    <button className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left">
                        <div className="font-medium text-gray-900">プロンプト編集</div>
                        <div className="text-sm text-gray-500">AIの応答を調整</div>
                    </button>
                    <button className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left">
                        <div className="font-medium text-gray-900">顧客サポート</div>
                        <div className="text-sm text-gray-500">問い合わせ対応</div>
                    </button>
                </div>
            </div>
        </div>
    );
}
