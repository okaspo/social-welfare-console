import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, AlertTriangle, checkCircle, ArrowUpRight, CheckCircle } from 'lucide-react';

export default async function RevenueDashboard() {
    const supabase = await createClient();

    // Fetch all organizations with plan info
    const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, plan, subscription_status, current_period_end, stripe_customer_id')
        .order('created_at', { ascending: false });

    if (!orgs) return <div>Loading...</div>;

    // Calculate MRR (Estimated)
    const PRICES = {
        free: 0,
        standard: 9800,
        pro: 29800,
        enterprise: 98000 // Estimated average
    };

    const activeOrgs = orgs.filter(o => o.subscription_status === 'active');

    // @ts-ignore
    const mrr = activeOrgs.reduce((sum, org) => sum + (PRICES[org.plan as keyof typeof PRICES] || 0), 0);

    const totalCustomers = activeOrgs.length;

    // Failed Payments / Action Required
    const failedPayments = orgs.filter(o => ['past_due', 'unpaid'].includes(o.subscription_status || ''));

    // Plan Distribution
    const planCounts = {
        free: orgs.filter(o => o.plan === 'free').length,
        standard: orgs.filter(o => o.plan === 'standard').length,
        pro: orgs.filter(o => o.plan === 'pro').length,
        enterprise: orgs.filter(o => o.plan === 'enterprise').length,
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">収益管理ダッシュボード</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estimated MRR</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">¥{mrr.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">
                            Standard: {planCounts.standard} | Pro: {planCounts.pro}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-600">Action Required</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{failedPayments.length}</div>
                        <p className="text-xs text-red-600 opacity-80">
                            Payment failures
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Attention List */}
            {failedPayments.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4">
                    <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5" />
                        決済エラー対応が必要な顧客
                    </h3>
                    <div className="space-y-2">
                        {failedPayments.map(org => (
                            <div key={org.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm border border-red-100">
                                <div>
                                    <p className="font-bold text-gray-800">{org.name}</p>
                                    <p className="text-sm text-gray-500">Plan: {org.plan} | Status: {org.subscription_status}</p>
                                </div>
                                <button className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors">
                                    再請求メール送信 (葵)
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Organizations */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Organizations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {orgs.slice(0, 5).map(org => (
                            <div key={org.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium">{org.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{org.id}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${org.plan === 'pro' ? 'bg-purple-100 text-purple-800' :
                                            org.plan === 'standard' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                        }`}>
                                        {org.plan.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
