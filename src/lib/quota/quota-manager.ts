/**
 * Quota Management - Feature Gating & Usage Limits
 * Checks plan limits and blocks actions when quotas are exceeded
 */

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface QuotaCheckResult {
    allowed: boolean;
    currentCount: number;
    limit: number;
    remaining: number; // -1 for unlimited
}

export interface PlanFeatures {
    can_download_word: boolean;
    has_long_term_memory: boolean;
    has_risk_detection: boolean;
    has_magic_link: boolean;
    has_custom_domain: boolean;
    has_audit_logs: boolean;
    is_dedicated_support: boolean;
}

export class QuotaExceededError extends Error {
    constructor(
        public quotaType: 'chat' | 'doc_gen',
        public currentCount: number,
        public limit: number
    ) {
        super(`Quota exceeded: ${quotaType} (${currentCount}/${limit})`);
        this.name = 'QuotaExceededError';
    }
}

// ============================================================================
// Quota Checking Functions
// ============================================================================

/**
 * Check if document generation is allowed
 */
export async function checkDocGenQuota(organizationId: string): Promise<QuotaCheckResult> {
    const supabase = createClient();

    // Call database function
    const { data, error } = await supabase.rpc('check_doc_gen_quota', {
        org_id: organizationId
    });

    if (error) {
        console.error('Quota check error:', error);
        // Fail open for now, but log error
        return { allowed: true, currentCount: 0, limit: -1, remaining: -1 };
    }

    return {
        allowed: data.allowed,
        currentCount: data.current_count,
        limit: data.limit,
        remaining: data.remaining
    };
}

/**
 * Increment document generation count after successful generation
 */
export async function incrementDocGenCount(organizationId: string): Promise<void> {
    const supabase = createClient();

    await supabase.rpc('increment_doc_gen_count', {
        org_id: organizationId
    });
}

/**
 * Check if a specific feature is available for the plan
 */
export async function checkFeatureAccess(
    organizationId: string,
    featureKey: keyof PlanFeatures
): Promise<boolean> {
    const supabase = createClient();

    // Get organization's plan
    const { data: org } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', organizationId)
        .single();

    if (!org) return false;

    // Get plan features
    const { data: planLimit } = await supabase
        .from('plan_limits')
        .select('features')
        .eq('plan_id', org.plan || 'free')
        .single();

    if (!planLimit?.features) return false;

    return planLimit.features[featureKey] === true;
}

/**
 * Get all features for a plan
 */
export async function getPlanFeatures(planId: string): Promise<PlanFeatures> {
    const supabase = createClient();

    const { data } = await supabase
        .from('plan_limits')
        .select('features')
        .eq('plan_id', planId)
        .single();

    // Default features (free plan)
    const defaults: PlanFeatures = {
        can_download_word: false,
        has_long_term_memory: false,
        has_risk_detection: false,
        has_magic_link: false,
        has_custom_domain: false,
        has_audit_logs: false,
        is_dedicated_support: false
    };

    return { ...defaults, ...(data?.features || {}) };
}

// ============================================================================
// Guard Function for Server Actions
// ============================================================================

/**
 * Guard wrapper for document generation
 * Throws QuotaExceededError if quota is exceeded
 */
export async function guardDocGen(organizationId: string): Promise<void> {
    const quota = await checkDocGenQuota(organizationId);

    if (!quota.allowed) {
        throw new QuotaExceededError('doc_gen', quota.currentCount, quota.limit);
    }
}

/**
 * Guard wrapper for feature access
 * Returns false if feature is not available
 */
export async function guardFeature(
    organizationId: string,
    featureKey: keyof PlanFeatures
): Promise<boolean> {
    return checkFeatureAccess(organizationId, featureKey);
}
