'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Save, Check, Shield, Info, Database, MessageSquare, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface PlanLimit {
    plan_id: string;
    features: Record<string, boolean>;
    monthly_price_jpy: number;
    description: string;
    max_users: number;
    max_monthly_chat: number;
    storage_limit_mb: number;
}

export default function PlanFeaturesPage() {
    const [plans, setPlans] = useState<PlanLimit[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const supabase = createClient();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        const { data } = await supabase
            .from('plan_limits')
            .select('*')
            .order('plan_id');

        if (data) {
            const order = ['free', 'standard', 'pro', 'enterprise'];
            const sorted = data.sort((a, b) => order.indexOf(a.plan_id) - order.indexOf(b.plan_id));
            setPlans(sorted as PlanLimit[]);
        }
        setLoading(false);
    };

    const handleValueChange = (planIndex: number, field: keyof PlanLimit, value: any) => {
        const newPlans = [...plans];
        // @ts-ignore
        newPlans[planIndex][field] = value;
        setPlans(newPlans);
        setMessage('変更を保存してください');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const plan of plans) {
                const { error } = await supabase
                    .from('plan_limits')
                    .update({
                        monthly_price_jpy: plan.monthly_price_jpy,
                        description: plan.description,
                        max_users: plan.max_users,
                        max_monthly_chat: plan.max_monthly_chat,
                        storage_limit_mb: plan.storage_limit_mb
                    })
                    .eq('plan_id', plan.plan_id);
                if (error) throw error;
            }
            setMessage('保存しました');
            setTimeout(() => setMessage(''), 3000);
        } catch (e: any) {
            alert('Error: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-6 w-6 text-indigo-600" />
                        プラン管理 (Pricing & Limits)
                    </h1>
                    <p className="text-gray-500 mt-1">価格、クォータ（制限）、機能フラグを一元管理します。</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all font-bold shadow-sm"
                >
                    {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                    変更を保存
                </button>
            </div>

            {message && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 border border-green-200 animate-in fade-in slide-in-from-top-2">
                    <Check className="h-4 w-4" /> {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {plans.map((plan, idx) => (
                    <div key={plan.plan_id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                            <h2 className="font-bold text-lg uppercase">{plan.plan_id}</h2>
                            {plan.plan_id === 'enterprise' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Custom</span>}
                        </div>

                        <div className="p-4 space-y-6 flex-1 overflow-y-auto max-h-[800px]">
                            {/* 1. Basic Info */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <Info className="h-3 w-3" /> Basic Info
                                </h3>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">月額料金 (JPY)</label>
                                    <Input
                                        type="number"
                                        value={plan.monthly_price_jpy}
                                        onChange={(e) => handleValueChange(idx, 'monthly_price_jpy', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">説明文</label>
                                    <Textarea
                                        className="h-20 text-xs"
                                        value={plan.description || ''}
                                        onChange={(e) => handleValueChange(idx, 'description', e.target.value)}
                                        placeholder="プランの概要..."
                                    />
                                </div>
                            </section>

                            {/* 2. Quotas */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                    <Database className="h-3 w-3" /> Quotas
                                </h3>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600 flex justify-between">
                                        最大ユーザー数 <Users className="h-3 w-3 text-gray-400" />
                                    </label>
                                    <Input
                                        type="number"
                                        value={plan.max_users}
                                        onChange={(e) => handleValueChange(idx, 'max_users', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600 flex justify-between">
                                        月間チャット上限 <MessageSquare className="h-3 w-3 text-gray-400" />
                                    </label>
                                    <Input
                                        type="number"
                                        value={plan.max_monthly_chat}
                                        onChange={(e) => handleValueChange(idx, 'max_monthly_chat', parseInt(e.target.value) || 0)}
                                    />
                                    <span className="text-[10px] text-gray-400">-1 for unlimited</span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600 flex justify-between">
                                        ストレージ (MB) <Database className="h-3 w-3 text-gray-400" />
                                    </label>
                                    <Input
                                        type="number"
                                        value={plan.storage_limit_mb}
                                        onChange={(e) => handleValueChange(idx, 'storage_limit_mb', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </section>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
