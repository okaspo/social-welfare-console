import Link from 'next/link';
import { Building2, Heart, Stethoscope, ArrowRight, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminHubPage() {
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

    if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
        redirect('/chat');
    }

    const consoles = [
        {
            id: 'swc',
            name: '社会福祉法人',
            description: '理事会運営、評議員会、役員管理、コンプライアンス',
            icon: Building2,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-600',
            path: '/admin/swc',
            phase: 'active',
            features: ['顧客管理', 'プラン管理', 'ナレッジ管理', 'プロンプト設定']
        },
        {
            id: 'npo',
            name: 'NPO法人',
            description: '認定NPO取得支援、ファンドレイジング、ボランティア管理',
            icon: Heart,
            color: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            textColor: 'text-orange-600',
            path: '/admin/npo',
            phase: 'beta',
            features: ['寄付管理', '認定申請', 'ボランティアDB', '助成金検索']
        },
        {
            id: 'med',
            name: '医療法人',
            description: '医療法対応、MS法人管理、都道府県届出サポート',
            icon: Stethoscope,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            textColor: 'text-emerald-600',
            path: '/admin/med',
            phase: 'alpha',
            features: ['届出管理', 'MS法人連携', '診療報酬', '事業承継']
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-900 rounded-xl">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Admin Hub</h1>
                            <p className="text-sm text-gray-500">マルチエンティティ管理コンソール</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        管理コンソールを選択
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        各法人種別に最適化された管理機能を提供します。
                        対象の法人タイプを選択してコンソールにアクセスしてください。
                    </p>
                </div>

                {/* Console Cards */}
                <div className="grid md:grid-cols-3 gap-8">
                    {consoles.map((console) => {
                        const Icon = console.icon;
                        const isActive = console.phase === 'active';
                        const isBeta = console.phase === 'beta';
                        const isAlpha = console.phase === 'alpha';

                        return (
                            <Link
                                key={console.id}
                                href={console.path}
                                className={`
                                    group relative bg-white rounded-2xl border-2 p-6 transition-all duration-300
                                    hover:shadow-xl hover:-translate-y-1
                                    ${console.borderColor}
                                `}
                            >
                                {/* Phase Badge */}
                                {(isBeta || isAlpha) && (
                                    <div className="absolute top-4 right-4">
                                        <span className={`
                                            px-2 py-1 text-xs font-bold rounded-full
                                            ${isBeta ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {isBeta ? 'BETA' : 'ALPHA'}
                                        </span>
                                    </div>
                                )}

                                {/* Icon */}
                                <div className={`
                                    w-16 h-16 rounded-2xl bg-gradient-to-br ${console.color}
                                    flex items-center justify-center mb-6 shadow-lg
                                    group-hover:scale-110 transition-transform
                                `}>
                                    <Icon className="h-8 w-8 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className={`text-xl font-bold mb-2 ${console.textColor}`}>
                                    {console.name}
                                </h3>
                                <p className="text-gray-600 text-sm mb-6">
                                    {console.description}
                                </p>

                                {/* Features */}
                                <div className="space-y-2 mb-6">
                                    {console.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                                            <div className={`w-1.5 h-1.5 rounded-full ${console.textColor.replace('text-', 'bg-')}`} />
                                            {feature}
                                        </div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <div className={`
                                    flex items-center gap-2 font-medium
                                    ${console.textColor} group-hover:gap-3 transition-all
                                `}>
                                    コンソールを開く
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-4 gap-6">
                    {[
                        { label: '総顧客数', value: '124', suffix: '法人' },
                        { label: 'アクティブユーザー', value: '1,847', suffix: '人' },
                        { label: '今月の売上', value: '¥2.4M', suffix: '' },
                        { label: 'チャット数', value: '15,432', suffix: '回' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl border p-6 text-center">
                            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                            <div className="text-sm text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
