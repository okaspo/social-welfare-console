'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Save, Check, Shield } from 'lucide-react';

interface PlanLimit {
    plan_id: string;
    features: Record<string, boolean>;
}

export default function PlanFeaturesPage() {
    const [plans, setPlans] = useState<PlanLimit[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const supabase = createClient();

    const FEATURES = [
        { key: 'email_sending', label: 'Eメール一斉送信' },
        { key: 'word_export', label: 'Word出力' },
        { key: 'audit_logs', label: '監査ログ閲覧' },
        { key: 'custom_domain', label: '独自ドメイン' },
        { key: 'priority_support', label: '優先サポート' },
        { key: 'long_term_memory', label: '長期記憶 (Pin)' },
    ];

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        const { data } = await supabase
            .from('plan_limits')
            .select('*')
            .order('plan_id'); // free, standard, pro, enterprise order (approx)

        if (data) {
            // Sort manually to ensure Free -> Standard -> Pro -> Enterprise
            const order = ['free', 'standard', 'pro', 'enterprise'];
            const sorted = data.sort((a, b) => order.indexOf(a.plan_id) - order.indexOf(b.plan_id));
            setPlans(sorted as PlanLimit[]);
        }
        setLoading(false);
    };

    const handleToggle = (planIndex: number, featureKey: string) => {
        const newPlans = [...plans];
        const current = newPlans[planIndex].features[featureKey];
        newPlans[planIndex].features = {
            ...newPlans[planIndex].features,
            [featureKey]: !current
        };
        setPlans(newPlans);
        setMessage('変更を保存してください');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const plan of plans) {
                const { error } = await supabase
                    .from('plan_limits')
                    .update({ features: plan.features })
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
        <div className="max-w-6xl mx-auto p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-6 w-6 text-indigo-600" />
                        プラン機能マトリクス
                    </h1>
                    <p className="text-gray-500 mt-1">各プランで利用可能な機能を制御します。</p>
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

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-4 text-left font-medium text-gray-500">機能名</th>
                            {plans.map(p => (
                                <th key={p.plan_id} className="p-4 text-center font-bold text-gray-900 uppercase text-sm w-32">
                                    {p.plan_id}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {FEATURES.map(feature => (
                            <tr key={feature.key} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 font-medium text-gray-700 border-r border-gray-100 bg-gray-50/30">
                                    {feature.label}
                                    <div className="text-xs text-gray-400 font-mono font-normal mt-0.5">{feature.key}</div>
                                </td>
                                {plans.map((p, idx) => (
                                    <td key={p.plan_id} className="p-4 text-center">
                                        <div className="flex justify-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={!!p.features[feature.key]}
                                                    onChange={() => handleToggle(idx, feature.key)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-sm text-blue-800">
                <h3 className="font-bold flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4" />
                    管理者メモ
                </h3>
                <p>
                    ここでの設定変更は即座に全てのユーザーセッションに反映されます（リロード後）。<br />
                    PlanGateコンポーネントを使用している箇所が対象です。
                </p>
            </div>
        </div>
    );
}
