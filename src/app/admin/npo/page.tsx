import { Heart, Users, Gift, TrendingUp, Sparkles } from 'lucide-react';

export default function NpoDashboardPage() {
    const stats = [
        { label: '登録団体数', value: '23', change: '+5', icon: Heart },
        { label: '月間寄付額', value: '¥450K', change: '+18%', icon: Gift },
        { label: 'ボランティア', value: '156', change: '+12', icon: Users },
        { label: '助成金マッチ', value: '8', change: 'new', icon: TrendingUp },
    ];

    return (
        <div className="p-6">
            {/* Beta Notice */}
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                        <div className="font-medium text-orange-900">ベータ版をご利用いただきありがとうございます</div>
                        <div className="text-sm text-orange-700">
                            NPO法人向け機能は現在開発中です。フィードバックをお待ちしております。
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
                <p className="text-gray-600">NPO法人向けサービスの状況</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white rounded-xl border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <Icon className="h-5 w-5 text-orange-600" />
                                </div>
                                <span className="text-sm font-medium text-green-600">{stat.change}</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <div className="text-sm text-gray-500">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Coming Soon Features */}
            <div className="bg-white rounded-xl border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">開発中の機能</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-dashed rounded-lg">
                        <div className="font-medium text-gray-900">🎁 寄付管理</div>
                        <div className="text-sm text-gray-500">寄付者管理、領収書発行</div>
                        <div className="mt-2 text-xs text-orange-600">Coming Soon</div>
                    </div>
                    <div className="p-4 border border-dashed rounded-lg">
                        <div className="font-medium text-gray-900">🎖️ 認定NPO支援</div>
                        <div className="text-sm text-gray-500">認定取得サポート機能</div>
                        <div className="mt-2 text-xs text-orange-600">Coming Soon</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
