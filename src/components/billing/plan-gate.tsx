// Plan Gate Component
// Lock features behind plan requirements with upgrade UI

'use client';

import { ReactNode } from 'react';
import { Lock, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

interface PlanGateProps {
    feature: string;
    requiredPlan: 'standard' | 'pro' | 'enterprise';
    currentPlan: string;
    children: ReactNode;
    showPreview?: boolean;
}

const PLAN_HIERARCHY: Record<string, number> = {
    free: 0,
    standard: 1,
    pro: 2,
    enterprise: 3,
};

const PLAN_LABELS: Record<string, string> = {
    standard: 'Standard',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
    standard: 'blue',
    pro: 'purple',
    enterprise: 'amber',
};

export default function PlanGate({
    feature,
    requiredPlan,
    currentPlan,
    children,
    showPreview = false,
}: PlanGateProps) {
    const currentLevel = PLAN_HIERARCHY[currentPlan.toLowerCase()] || 0;
    const requiredLevel = PLAN_HIERARCHY[requiredPlan.toLowerCase()] || 999;

    const hasAccess = currentLevel >= requiredLevel;

    if (hasAccess) {
        return <>{children}</>;
    }

    // Lock Screen
    const color = PLAN_COLORS[requiredPlan];
    const gradientClass = color === 'blue' ? 'from-blue-500 to-blue-600' :
        color === 'purple' ? 'from-purple-500 to-purple-600' :
            'from-amber-500 to-amber-600';
    const borderClass = color === 'blue' ? 'border-blue-200' :
        color === 'purple' ? 'border-purple-200' :
            'border-amber-200';
    const textColorClass = color === 'blue' ? 'text-blue-600' :
        color === 'purple' ? 'text-purple-600' :
            'text-amber-600';

    return (
        <div className={`relative ${showPreview ? 'min-h-[400px]' : ''}`}>
            {/* Preview (blurred) */}
            {showPreview && (
                <div className="pointer-events-none select-none blur-sm opacity-30">
                    {children}
                </div>
            )}

            {/* Lock Overlay */}
            <div
                className={`${showPreview ? 'absolute inset-0' : 'min-h-[400px]'
                    } flex items-center justify-center bg-gradient-to-br from-gray-50 to-white border-2 border-dashed ${borderClass} rounded-xl`}
            >
                <div className="text-center p-8 max-w-md">
                    {/* Icon */}
                    <div
                        className={`mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}
                    >
                        <Lock className="h-8 w-8 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                        <Sparkles className={`h-5 w-5 ${textColorClass}`} />
                        {PLAN_LABELS[requiredPlan]}プラン限定機能
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-6">
                        <span className="font-semibold text-gray-800">{feature}</span>
                        <br />
                        この機能を利用するには
                        <span className={`font-bold ${textColorClass}`}>
                            {PLAN_LABELS[requiredPlan]}
                        </span>
                        プランへのアップグレードが必要です。
                    </p>

                    {/* Features List */}
                    <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200 text-left">
                        <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            {PLAN_LABELS[requiredPlan]}プランで利用可能:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                            {requiredPlan === 'standard' && (
                                <>
                                    <li>• AI チャット (gpt-4o-mini)</li>
                                    <li>• 月10回まで精密チェック</li>
                                    <li>• 基本機能フル利用</li>
                                </>
                            )}
                            {requiredPlan === 'pro' && (
                                <>
                                    <li>• 高度なAI (gpt-4o + o1)</li>
                                    <li>• 月50回の精密チェック</li>
                                    <li>• Word書き出し</li>
                                    <li>• メール一括送信</li>
                                    <li>• 助成金マッチング</li>
                                </>
                            )}
                            {requiredPlan === 'enterprise' && (
                                <>
                                    <li>• 無制限AI利用</li>
                                    <li>• 専用サポート</li>
                                    <li>• カスタム機能開発</li>
                                    <li>• SLA保証</li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* CTA Button */}
                    <Link
                        href="/dashboard/settings/billing"
                        className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${gradientClass} text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200`}
                    >
                        <Sparkles className="h-5 w-5" />
                        {PLAN_LABELS[requiredPlan]}プランにアップグレード
                    </Link>

                    <p className="mt-4 text-xs text-gray-500">
                        いつでもプラン変更・解約が可能です
                    </p>
                </div>
            </div>
        </div>
    );
}
