import { getScopedPlanLimits } from '@/lib/admin/scoped-queries';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Building2, CreditCard, Users, Zap } from 'lucide-react';

export default async function SwcPlansPage() {
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

    // Fetch plans with entity_type scoping
    const plans = await getScopedPlanLimits({
        pathname: '/admin/swc/plans',
        skipFilter: true // Plans are shared across entities
    });

    const planInfo: Record<string, { name: string; color: string; icon: typeof CreditCard }> = {
        free: { name: 'フリー', color: 'bg-gray-100 text-gray-700', icon: CreditCard },
        standard: { name: 'スタンダード', color: 'bg-blue-100 text-blue-700', icon: CreditCard },
        pro: { name: 'プロ', color: 'bg-purple-100 text-purple-700', icon: Zap },
        enterprise: { name: 'エンタープライズ', color: 'bg-amber-100 text-amber-700', icon: Building2 },
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Building2 className="h-4 w-4" />
                    <span>社会福祉法人コンソール</span>
                    <span>/</span>
                    <span>プラン管理</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">プラン管理</h1>
                <p className="text-gray-600 mt-1">
                    プランごとの制限と機能を確認・編集します
                </p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-2 gap-6">
                {plans.map((plan: any) => {
                    const info = planInfo[plan.plan_id] || planInfo.free;
                    const Icon = info.icon;
                    const features = plan.features || {};

                    return (
                        <div key={plan.plan_id} className="bg-white rounded-xl border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${info.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{info.name}</h3>
                                        <span className="text-xs text-gray-500">{plan.plan_id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Limits */}
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">チャット制限</span>
                                    <span className="font-medium">
                                        {plan.monthly_chat_limit === -1 ? '無制限' : `${plan.monthly_chat_limit}/月`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">ドキュメント生成</span>
                                    <span className="font-medium">
                                        {plan.monthly_doc_gen_limit === -1 ? '無制限' : `${plan.monthly_doc_gen_limit}/月`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">ストレージ</span>
                                    <span className="font-medium">
                                        {plan.storage_limit_mb ? `${plan.storage_limit_mb}MB` : '無制限'}
                                    </span>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="border-t pt-4">
                                <div className="text-xs font-medium text-gray-500 mb-2">機能フラグ</div>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(features).map(([key, value]) => (
                                        <span
                                            key={key}
                                            className={`px-2 py-1 text-xs rounded ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                                                }`}
                                        >
                                            {key}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
