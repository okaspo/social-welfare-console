'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, Check, X, Loader2 } from 'lucide-react';

const FEATURES = [
    // Communication & Output
    { key: 'email_sending', label: 'Eメール一斉送信', description: '役員へのメール一括送信機能' },
    { key: 'word_export', label: 'Word出力', description: '議事録をWord形式でエクスポート' },
    { key: 'pdf_export', label: 'PDF出力', description: 'ドキュメントをPDF形式で出力' },

    // AI & Advanced Features
    { key: 'long_term_memory', label: '長期記憶 (Pin)', description: 'チャット履歴のピン留め・保存' },
    { key: 'precision_check', label: '精度チェック', description: 'o1モデルによる回答の再検証' },
    { key: 'legal_advisor', label: '法令チェック', description: 'o1による法令遵守チェック' },
    { key: 'advanced_ai_models', label: '高度AIモデル', description: 'gpt-4oや o1 モデルへのアクセス' },
    { key: 'custom_prompts', label: 'カスタムプロンプト', description: 'ペルソナのカスタマイズ' },

    // Templates & Documents
    { key: 'document_templates', label: 'ドキュメントテンプレート', description: 'プロ向けテンプレートの利用' },
    { key: 'auto_report_generation', label: '自動レポート生成', description: '現況報告書等の自動生成' },

    // Administration & Security
    { key: 'audit_logs', label: '監査ログ閲覧', description: '操作履歴の詳細確認' },
    { key: 'custom_domain', label: '独自ドメイン', description: 'カスタムドメインの設定' },
    { key: 'priority_support', label: '優先サポート', description: '専任担当者による対応' },
    { key: 'sso_integration', label: 'SSO統合', description: 'シングルサインオン（SAML/OAuth）' },
    { key: 'api_access', label: 'API アクセス', description: '外部システムとの連携API' },

    // Advanced Features (Future)
    { key: 'bulk_operations', label: '一括操作', description: 'データの一括インポート/エクスポート' },
    { key: 'advanced_analytics', label: '高度な分析', description: 'カスタムダッシュボード・レポート' },
    { key: 'white_label', label: 'ホワイトラベル', description: 'ブランドカスタマイズ' },
];

const PLAN_ORDER = ['free', 'standard', 'pro', 'enterprise'];

export default function FeaturesPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        const { data } = await supabase
            .from('plan_limits')
            .select('plan_id, features')
            .in('plan_id', PLAN_ORDER);

        // Sort by plan hierarchy
        const sorted = PLAN_ORDER.map(pid =>
            data?.find(p => p.plan_id === pid)
        ).filter(Boolean);

        setPlans(sorted);
        setLoading(false);
    };

    // Determine which plan a feature first appears in
    const getMinimumPlan = (featureKey: string): string => {
        for (const planId of PLAN_ORDER) {
            const plan = plans.find(p => p.plan_id === planId);
            if (plan?.features[featureKey]) {
                return planId;
            }
        }
        return 'enterprise';
    };

    // Group features by tier (cumulative model)
    const featuresByTier = useMemo(() => {
        const tiers: Record<string, typeof FEATURES> = {
            free: [],
            standard: [],
            pro: [],
            enterprise: [],
        };

        FEATURES.forEach(feature => {
            const minPlan = getMinimumPlan(feature.key);
            if (tiers[minPlan]) {
                tiers[minPlan].push(feature);
            }
        });

        return tiers;
    }, [plans]);

    const toggleFeature = async (planId: string, featureKey: string) => {
        setSaving(true);
        const plan = plans.find(p => p.plan_id === planId);
        const newFeatures = {
            ...plan.features,
            [featureKey]: !plan.features[featureKey]
        };

        await supabase
            .from('plan_limits')
            .update({ features: newFeatures })
            .eq('plan_id', planId);

        await fetchPlans();  // Re-fetch to trigger re-sort
        setSaving(false);
    };

    const renderTierSection = (tier: string, tierFeatures: typeof FEATURES) => {
        if (tierFeatures.length === 0) return null;

        const tierLabels: Record<string, string> = {
            free: 'Freeプランから利用可能',
            standard: 'Standardプランから利用可能',
            pro: 'Proプランから利用可能',
            enterprise: 'Enterpriseプランから利用可能',
        };

        return (
            <div key={tier} className="mb-8">
                <h2 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wide">
                    【{tierLabels[tier]}】
                </h2>
                <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">機能</th>
                                {plans.map(plan => (
                                    <th key={plan.plan_id} className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                                        {plan.plan_id}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tierFeatures.map(feature => (
                                <tr key={feature.key} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{feature.label}</div>
                                            <div className="text-xs text-gray-500">{feature.description}</div>
                                        </div>
                                    </td>
                                    {plans.map(plan => (
                                        <td key={plan.plan_id} className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => toggleFeature(plan.plan_id, feature.key)}
                                                disabled={saving}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                                                title={plan.features[feature.key] ? '有効' : '無効'}
                                            >
                                                {plan.features[feature.key] ? (
                                                    <Check className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <X className="h-5 w-5 text-gray-300" />
                                                )}
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-10 text-center">
                <Loader2 className="animate-spin h-8 w-8 mx-auto text-gray-400" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-indigo-600" />
                    機能管理 (Feature Matrix)
                </h1>
                <p className="text-gray-500 mt-1">各プランで利用可能な機能を管理します（積み上げ式）</p>
            </div>

            {renderTierSection('free', featuresByTier.free)}
            {renderTierSection('standard', featuresByTier.standard)}
            {renderTierSection('pro', featuresByTier.pro)}
            {renderTierSection('enterprise', featuresByTier.enterprise)}
        </div>
    );
}
