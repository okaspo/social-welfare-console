import { getScopedPlanLimits } from '@/lib/admin/scoped-queries';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Building2, CreditCard, Users, Zap } from 'lucide-react';
import AdminPlanEditor from '@/components/admin/plan-editor';
import PriceManager from '@/components/admin/price-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { requireSystemAdmin } from '@/lib/auth/admin-auth';

export default async function SwcPlansPage() {
    // Strict System Admin Check
    await requireSystemAdmin();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch plans with entity_type scoping
    const plans = await getScopedPlanLimits({
        pathname: '/admin/swc/plans',
        skipFilter: true // Plans are shared across entities
    });

    // Fetch Prices (Universal)
    const { data: prices } = await supabase
        .from('plan_prices')
        .select('*')
        .order('amount');

    // Format for PriceManager
    const simplePlans = plans.map((p: any) => ({
        plan_id: p.plan_id,
        name: p.plan_id.toUpperCase() // Or map to Japanese names if you want
    }));

    return (
        <div className="p-6 pb-20">
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
                    各プランの機能制限および価格設定を管理します。
                </p>
            </div>

            <Tabs defaultValue="limits" className="space-y-8">
                <TabsList>
                    <TabsTrigger value="limits">機能と制限 (Limits)</TabsTrigger>
                    <TabsTrigger value="prices">価格設定 (Prices)</TabsTrigger>
                </TabsList>

                <TabsContent value="limits" className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 mb-6">
                        ここは<strong>機能制限（クォータ）</strong>の管理画面です。ユーザー数や生成回数の上限を設定できます。
                    </div>
                    {/* @ts-ignore */}
                    <AdminPlanEditor initialPlans={plans} />
                </TabsContent>

                <TabsContent value="prices" className="space-y-4">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-800 mb-6">
                        ここは<strong>価格（Price）</strong>の管理画面です。Stripe連携用の価格を作成・編集します。
                    </div>
                    {/* @ts-ignore */}
                    <PriceManager plans={simplePlans} prices={prices || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
