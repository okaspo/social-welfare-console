import { getAdminClient } from '@/lib/supabase/admin'

// Pricing per 1,000,000 tokens (USD)
const PRICING = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'text-embedding-3-small': { input: 0.02, output: 0.00 },
    'o1-preview': { input: 15.00, output: 60.00 },
} as const;

type ModelName = keyof typeof PRICING;

export type TaskComplexity = 'simple' | 'complex' | 'embedding' | 'reasoning';

export class LimitReachedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LimitReachedError';
    }
}

/**
 * Calculates estimated cost for a request
 */
export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const price = PRICING[model as ModelName] || PRICING['gpt-4o-mini']; // Default to mini price if unknown
    const inputCost = (inputTokens / 1_000_000) * price.input;
    const outputCost = (outputTokens / 1_000_000) * price.output;
    return inputCost + outputCost;
}

/**
 * Selects the appropriate model based on plan and task complexity.
 * Implements the "Model Router" logic with Reasoning support.
 */
export function selectModel(plan: string | undefined, task: TaskComplexity): ModelName {
    // Embedding is always fixed
    if (task === 'embedding') return 'text-embedding-3-small';

    const normalizedPlan = plan?.toUpperCase() || 'FREE';

    // 1. Standard / Free -> Always Mini (No reasoning access)
    if (normalizedPlan === 'STANDARD' || normalizedPlan === 'FREE') {
        return 'gpt-4o-mini';
    }

    // 2. Pro / Enterprise
    if (normalizedPlan === 'PRO' || normalizedPlan === 'ENTERPRISE') {
        if (task === 'reasoning') return 'o1-preview';
        if (task === 'complex') return 'gpt-4o';
        return 'gpt-4o-mini';
    }

    // Default Fallback
    return 'gpt-4o-mini';
}

/**
 * Checks if the organization has exceeded their monthly API cost limit OR reasoning limit.
 */
export async function checkUsageLimit(organizationId: string, intendedModel?: string) {
    const supabase = getAdminClient();

    // 1. Get Plan Limit
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select(`
            plan,
            plan_details:plan_id (
                max_monthly_cost_usd,
                reasoning_monthly_limit
            )
        `)
        .eq('id', organizationId)
        .single();

    if (orgError || !org) {
        console.error('Usage check failed: Org not found', orgError);
        return;
    }

    // 2. Setup Limits
    let costLimit = 1.0;
    let reasoningLimit = 0;
    const plan = org.plan?.toUpperCase();

    // @ts-ignore
    if (org.plan_details) {
        // @ts-ignore
        costLimit = org.plan_details.max_monthly_cost_usd || costLimit;
        // @ts-ignore
        reasoningLimit = org.plan_details.reasoning_monthly_limit || 0;
    } else {
        // Fallback limits
        if (plan === 'STANDARD') costLimit = 2.0;
        if (plan === 'PRO') { costLimit = 20.0; reasoningLimit = 50; }
        if (plan === 'ENTERPRISE') { costLimit = 100.0; reasoningLimit = 500; }
    }

    // 3. Fetch Usage Logs for Month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: logs, error: usageError } = await supabase
        .from('usage_logs')
        .select('estimated_cost_usd, model_used')
        .eq('organization_id', organizationId)
        .gte('created_at', firstDayOfMonth);

    if (usageError) {
        console.error('Usage check failed: Could not fetch logs', usageError);
        return;
    }

    // 4. Check Cost Limit
    const currentCost = logs.reduce((sum: number, log: any) => sum + (log.estimated_cost_usd || 0), 0);
    if (currentCost >= costLimit) {
        throw new LimitReachedError(`Monthly API usage limit exceeded (${currentCost.toFixed(4)} / ${costLimit.toFixed(2)} USD). Please upgrade your plan.`);
    }

    // 5. Check Reasoning Limit (if intended model is o1)
    if (intendedModel && intendedModel.startsWith('o1')) {
        const reasoningCount = logs.filter((log: any) => log.model_used.startsWith('o1')).length;
        if (reasoningCount >= reasoningLimit) {
            throw new LimitReachedError(`Monthly Reasoning (o1) limit exceeded (${reasoningCount}/${reasoningLimit}). Please upgrade or wait for next month.`);
        }
    }

    return { currentCost, costLimit, reasoningLimit };
}

/**
 * Tracks usage after a successful generation.
 */
export async function trackUsage(
    organizationId: string,
    featureName: string,
    model: string,
    inputTokens: number,
    outputTokens: number
) {
    const cost = calculateCost(model, inputTokens, outputTokens);
    const supabase = getAdminClient();

    const { error } = await supabase.from('usage_logs').insert({
        organization_id: organizationId,
        feature_name: featureName,
        model_used: model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost_usd: cost
    });

    if (error) {
        console.error('Failed to log usage:', error);
    }
}
