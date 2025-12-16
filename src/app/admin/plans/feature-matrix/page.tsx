// Admin Plan Feature Matrix Editor
// Manage plan limits and feature availability

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Loader2, Plus, Trash2 } from 'lucide-react';

interface PlanLimit {
    id: string;
    name: string;
    o1_monthly_quota: number;
    precision_check_quota: number;
    ai_chat_enabled: boolean;
    word_export_enabled: boolean;
    email_sending_enabled: boolean;
    subsidy_matching_enabled: boolean;
}

export default function PlanFeatureMatrixPage() {
    const [plans, setPlans] = useState<PlanLimit[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    async function loadPlans() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('plan_limits')
            .select('*')
            .order('name');

        if (!error && data) {
            setPlans(data);
        }
        setLoading(false);
    }

    async function savePlan(plan: PlanLimit) {
        setSaving(true);
        const supabase = createClient();

        const { error } = await supabase
            .from('plan_limits')
            .update({
                o1_monthly_quota: plan.o1_monthly_quota,
                precision_check_quota: plan.precision_check_quota,
                ai_chat_enabled: plan.ai_chat_enabled,
                word_export_enabled: plan.word_export_enabled,
                email_sending_enabled: plan.email_sending_enabled,
                subsidy_matching_enabled: plan.subsidy_matching_enabled,
            })
            .eq('id', plan.id);

        if (!error) {
            alert('保存しました');
        } else {
            alert('保存に失敗しました');
        }
        setSaving(false);
    }

    function updatePlan(id: string, field: string, value: any) {
        setPlans(
            plans.map((p) => (p.id === id ? { ...p, [field]: value } : p))
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                プラン機能マトリクス
            </h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                プラン
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                o1月間クォータ
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                精密チェック
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                AIチャット
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Word書き出し
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                メール送信
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                助成金マッチング
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {plans.map((plan) => (
                            <tr key={plan.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                    {plan.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="number"
                                        value={plan.o1_monthly_quota}
                                        onChange={(e) =>
                                            updatePlan(plan.id, 'o1_monthly_quota', parseInt(e.target.value))
                                        }
                                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="number"
                                        value={plan.precision_check_quota}
                                        onChange={(e) =>
                                            updatePlan(
                                                plan.id,
                                                'precision_check_quota',
                                                parseInt(e.target.value)
                                            )
                                        }
                                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={plan.ai_chat_enabled}
                                        onChange={(e) =>
                                            updatePlan(plan.id, 'ai_chat_enabled', e.target.checked)
                                        }
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={plan.word_export_enabled}
                                        onChange={(e) =>
                                            updatePlan(plan.id, 'word_export_enabled', e.target.checked)
                                        }
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={plan.email_sending_enabled}
                                        onChange={(e) =>
                                            updatePlan(plan.id, 'email_sending_enabled', e.target.checked)
                                        }
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={plan.subsidy_matching_enabled}
                                        onChange={(e) =>
                                            updatePlan(
                                                plan.id,
                                                'subsidy_matching_enabled',
                                                e.target.checked
                                            )
                                        }
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => savePlan(plan)}
                                        disabled={saving}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                                    >
                                        {saving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        保存
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
