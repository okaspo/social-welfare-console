'use client';

import { Lock, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useUser } from '@/lib/hooks/use-user'; // Import useUser

interface PlanGateProps {
    featureKey: string;
    children: ReactNode;
    minPlan: 'standard' | 'pro' | 'enterprise';
    currentPlan?: string;
}

export function PlanGate({
    featureKey,
    children,
    minPlan,
    currentPlan
}: PlanGateProps) {
    const router = useRouter();
    const { subscription } = useUser();

    // Use prop if provided, otherwise fall back to hook, default to free
    const effectivePlan = currentPlan || subscription?.plan_id || 'free';

    // Dynamic Feature Check
    let hasAccess = false;
    if (subscription?.features) {
        hasAccess = !!subscription.features[featureKey];
    } else {
        // Fallback to hardcoded hierarchy during loading or if no sub
        hasAccess = checkPlanFeature(effectivePlan, featureKey);
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    // Locked state
    return (
        <div className="relative">
            {/* Blurred content */}
            <div className="pointer-events-none select-none">
                <div className="blur-sm opacity-40">
                    {children}
                </div>
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50/90 to-blue-50/90 dark:from-gray-900/90 dark:to-blue-900/90 backdrop-blur-sm rounded-lg">
                <div className="text-center p-8 max-w-md">
                    {/* Lock icon */}
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <Lock className="h-8 w-8 text-white" />
                    </div>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-semibold mb-4 shadow-md">
                        <Sparkles className="h-4 w-4" />
                        {minPlan.toUpperCase()} PLAN
                    </div>

                    {/* Message */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        この機能は{getPlanName(minPlan)}限定です
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {getFeatureDescription(featureKey)}
                    </p>

                    {/* CTA */}
                    <button
                        onClick={() => router.push('/dashboard/settings/billing')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                        プランをアップグレードする
                    </button>
                </div>
            </div>
        </div>
    );
}

function getPlanName(plan: string): string {
    const names: Record<string, string> = {
        standard: 'Standardプラン以上',
        pro: 'Proプラン以上',
        enterprise: 'Enterpriseプラン',
    };
    return names[plan] || plan;
}

function getFeatureDescription(key: string): string {
    const descriptions: Record<string, string> = {
        email_sending: '招集通知の一斉送信機能をご利用いただけます',
        word_export: '議事録をWord形式でエクスポートできます',
        long_term_memory: 'AIが重要な情報を長期記憶できます',
        custom_domain: '独自ドメインを設定できます',
        audit_logs: '詳細な監査ログを確認できます',
    };
    return descriptions[key] || 'この機能をご利用いただけます';
}

function checkPlanFeature(plan: string, feature: string): boolean {
    const hierarchy = ['free', 'standard', 'pro', 'enterprise'];
    const featureMinPlans: Record<string, string> = {
        email_sending: 'pro',
        word_export: 'pro',
        long_term_memory: 'standard',
        custom_domain: 'enterprise',
        audit_logs: 'pro',
    };

    const currentLevel = hierarchy.indexOf(plan.toLowerCase());
    const requiredLevel = hierarchy.indexOf(featureMinPlans[feature] || 'pro');

    return currentLevel >= requiredLevel;
}
