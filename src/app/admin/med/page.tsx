import { Stethoscope, Users, Building, TrendingUp, AlertTriangle, Construction } from 'lucide-react';

export default function MedDashboardPage() {
    const stats = [
        { label: '登録法人数', value: '5', change: 'α限定', icon: Stethoscope },
        { label: 'MS法人連携', value: '3', change: '-', icon: Building },
        { label: 'テストユーザー', value: '12', change: '-', icon: Users },
        { label: '開発進捗', value: '35%', change: '開発中', icon: TrendingUp },
    ];

    return (
        <div className="p-6">
            {/* Alpha Notice */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                        <div className="font-medium text-yellow-900">アルファ版 - 開発者専用</div>
                        <div className="text-sm text-yellow-700">
                            医療法人向け機能は現在開発中です。本番環境での使用は推奨されません。
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
                <p className="text-gray-600">医療法人向けサービスの開発状況</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white rounded-xl border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <Icon className="h-5 w-5 text-emerald-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">{stat.change}</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <div className="text-sm text-gray-500">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Under Construction */}
            <div className="bg-white rounded-xl border p-12 text-center">
                <Construction className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">開発中</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    医療法人向けの管理機能は Phase 3 で実装予定です。
                    社会福祉法人コンソールの開発完了後に着手します。
                </p>
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                    <span>予定リリース:</span>
                    <span className="font-medium">2025年Q2</span>
                </div>
            </div>
        </div>
    );
}
