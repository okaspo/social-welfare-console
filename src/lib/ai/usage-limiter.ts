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

    if (error || !data || data.length === 0) {
        console.error('Failed to check usage limit:', error);
        // Fail open (allow request) rather than fail closed
        return {
            allowed: true,
            currentCost: 0,
            limit: 0,
            usagePercent: 0,
        };
    }

    const result = data[0];

    return {
        allowed: !result.has_exceeded,
        currentCost: parseFloat(result.current_cost),
        limit: parseFloat(result.limit_cost),
        usagePercent: parseFloat(result.usage_percent),
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
