// Usage Limiter - Circuit Breaker for API Costs
import { createClient } from '@/lib/supabase/server';
import { calculateCost, type ModelName } from './model-router';

export class UsageLimitError extends Error {
    constructor(
        public currentCost: number,
        public limit: number,
        message?: string
    ) {
        super(message || `Monthly usage limit exceeded (${currentCost.toFixed(2)} / ${limit.toFixed(2)} USD)`);
        this.name = 'UsageLimitError';
    }
}

interface UsageCheck {
    allowed: boolean;
    currentCost: number;
    limit: number;
    usagePercent: number;
}

/**
 * Check if organization can make an AI request
 */
export async function checkUsageLimit(
    organizationId: string,
    planName: string
): Promise<UsageCheck> {
    const supabase = await createClient();

    // Get usage check from database function
    const { data, error } = await supabase.rpc('check_usage_limit', {
        p_organization_id: organizationId,
        p_plan_name: planName,
    });

    if (error) {
        console.error('Failed to check usage limit:', error);
        // Fail open (allow request) rather than fail closed
        return {
            allowed: true,
            currentCost: 0,
            limit: 0,
            usagePercent: 0,
        };
    }

    // Handle both JSONB (object) and TABLE (array) return formats
    // SQL function returns JSONB with { allowed, limit, currentCost }
    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
        return {
            allowed: true,
            currentCost: 0,
            limit: 0,
            usagePercent: 0,
        };
    }

    // Map SQL fields to TypeScript interface
    // SQL returns: allowed, limit, currentCost (from our JSONB function)
    // or has_exceeded, limit_cost, current_cost (from original TABLE function)
    const allowed = result.allowed !== undefined
        ? result.allowed
        : !result.has_exceeded;
    const currentCost = result.currentCost !== undefined
        ? parseFloat(result.currentCost || 0)
        : parseFloat(result.current_cost || 0);
    const limit = result.limit !== undefined
        ? parseFloat(result.limit || 0)
        : parseFloat(result.limit_cost || 0);

    return {
        allowed,
        currentCost,
        limit,
        usagePercent: limit > 0 ? (currentCost / limit) * 100 : 0,
    };
}

/**
 * Log API usage to database
 */
export async function logUsage(params: {
    organizationId: string;
    userId?: string;
    featureName: string;
    model: ModelName;
    inputTokens: number;
    outputTokens: number;
    metadata?: Record<string, any>;
}) {
    const supabase = await createClient();

    const cost = calculateCost(params.model, params.inputTokens, params.outputTokens);

    const { error } = await supabase.from('usage_logs').insert({
        organization_id: params.organizationId,
        user_id: params.userId || null,
        feature_name: params.featureName,
        model_used: params.model,
        input_tokens: params.inputTokens,
        output_tokens: params.outputTokens,
        estimated_cost_usd: cost,
        request_metadata: params.metadata || null,
    });

    if (error) {
        console.error('Failed to log usage:', error);
        // Don't throw - logging failure shouldn't break the app
    }
}

/**
 * Get current month usage summary
 */
export async function getMonthlyUsage(organizationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_monthly_usage_cost', {
        p_organization_id: organizationId,
    });

    if (error) {
        console.error('Failed to get monthly usage:', error);
        return 0;
    }

    return parseFloat(data || '0');
}
