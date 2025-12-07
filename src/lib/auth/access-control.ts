export type PricingPlan = 'FREE' | 'STANDARD' | 'PRO' | 'ENTERPRISE';

export type FeatureFlag =
    | 'word_export'
    | 'bulk_notice'
    | 'proxy_generation'
    | 'legal_check'
    | 'archive_search'
    | 'governance_report'
    | 'mock_audit';

const PLAN_FEATURES: Record<PricingPlan, FeatureFlag[]> = {
    FREE: [], // AI Minutes (Trial) is always enabled but no specific flags here
    STANDARD: ['word_export', 'archive_search'],
    PRO: ['word_export', 'archive_search', 'bulk_notice', 'proxy_generation', 'legal_check'],
    ENTERPRISE: ['word_export', 'archive_search', 'bulk_notice', 'proxy_generation', 'legal_check', 'governance_report', 'mock_audit']
};

export function canAccess(plan: PricingPlan, feature: FeatureFlag): boolean {
    const features = PLAN_FEATURES[plan] || [];
    return features.includes(feature);
}

export const PLAN_LABELS: Record<PricingPlan, string> = {
    FREE: 'フリープラン',
    STANDARD: 'スタンダードプラン',
    PRO: 'プロプラン',
    ENTERPRISE: 'エンタープライズ'
};
