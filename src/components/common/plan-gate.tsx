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

    // Database-Driven Feature Check (Priority)
    let hasAccess = false;
    if (subscription?.features) {
        // Use database features (from plan_limits)
        hasAccess = !!subscription.features[featureKey];
    } else {
        // Fallback to hierarchy check during loading
        hasAccess = checkPlanFeature(effectivePlan, featureKey);
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    // Determine which plan unlocks this feature
    const unlockPlan = getUnlockPlan(featureKey);

    // Locked state - Minimal inline design
    return (
        <div className="relative">
            {/* Slightly blurred content */}
            <div className="pointer-events-none select-none opacity-30 blur-[2px]">
                {children}
            </div>

            {/* Compact lock badge overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-xs text-center">
                    {/* Lock icon */}
                    <div className="mx-auto w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-2">
                        <Lock className="h-5 w-5 text-white" />
                    </div>

                    {/* Dynamic unlock message */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {unlockPlan}プランから利用可能
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        {getFeatureDescription(featureKey)}
                    </p>

                    {/* CTA */}
                    <button
                        onClick={() => router.push('/swc/dashboard/settings/billing')}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-xs font-medium hover:shadow-md transition-all hover:scale-105 active:scale-95"
                    >
                        プランを確認
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

function getUnlockPlan(featureKey: string): string {
    // Fallback mapping for determining unlock plan
    const unlockPlans: Record<string, string> = {
        email_sending: 'Pro',
        word_export: 'Pro',
        long_term_memory: 'Standard',
        custom_domain: 'Enterprise',
        audit_logs: 'Pro',
        priority_support: 'Enterprise',
    };
    return unlockPlans[featureKey] || 'Pro';
}
