// API Cost Control - Model Router & Pricing
// Automatically select optimal model based on task complexity and plan

export const MODEL_PRICING = {
    'gpt-4o': {
        input: 0.0025, // $2.50 per 1M tokens
        output: 0.010, // $10.00 per 1M tokens
    },
    'gpt-4o-mini': {
        input: 0.00015, // $0.15 per 1M tokens
        output: 0.0006, // $0.60 per 1M tokens
    },
    'o1-preview': {
        input: 0.015, // $15.00 per 1M tokens
        output: 0.060, // $60.00 per 1M tokens
    },
    'text-embedding-3-small': {
        input: 0.00002, // $0.02 per 1M tokens
        output: 0, // No output for embeddings
    },
} as const;

export type ModelName = keyof typeof MODEL_PRICING;

export interface TaskComplexity {
    type: 'simple' | 'moderate' | 'complex';
    reason?: string;
}

/**
 * Calculate estimated cost for a request
 */
export function calculateCost(
    model: ModelName,
    inputTokens: number,
    outputTokens: number = 0
): number {
    const pricing = MODEL_PRICING[model];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return inputCost + outputCost;
}

/**
 * Determine task complexity from prompt
 */
export function assessComplexity(prompt: string, context?: string): TaskComplexity {
    const lowerPrompt = prompt.toLowerCase();

    // Simple tasks
    if (
        lowerPrompt.length < 50 ||
        /^(こんにち|おはよう|こんばん|ありがとう|はい|いいえ)/.test(lowerPrompt)
    ) {
        return { type: 'simple', reason: 'Short greeting or confirmation' };
    }

    // Complex tasks
    if (
        lowerPrompt.includes('法的') ||
        lowerPrompt.includes('条文') ||
        lowerPrompt.includes('監査') ||
        lowerPrompt.includes('議事録') ||
        lowerPrompt.includes('定款') ||
        (context && context.length > 5000) // Large context = complex
    ) {
        return { type: 'complex', reason: 'Legal/governance task or large context' };
    }

    // Default: moderate
    return { type: 'moderate', reason: 'Standard consultation' };
}

/**
 * Select optimal model based on plan and task complexity
 */
export function selectModel(
    userPlan: string,
    complexity: TaskComplexity
): ModelName {
    // Free plan: No AI access
    if (userPlan === 'free' || userPlan === 'Free') {
        throw new Error('AI features not available in Free plan');
    }

    // Standard plan: Always use mini (cost control)
    if (userPlan === 'standard' || userPlan === 'Standard') {
        return 'gpt-4o-mini';
    }

    // Pro/Enterprise: Dynamic selection
    if (complexity.type === 'simple') {
        return 'gpt-4o-mini'; // Fast & cheap for greetings
    }

    if (complexity.type === 'complex') {
        return 'gpt-4o'; // Best model for important tasks
    }

    // Moderate: Use mini to save cost
    return 'gpt-4o-mini';
}

/**
 * Format cost for display
 */
export function formatCost(usd: number): string {
    if (usd < 0.01) {
        return '<¥1';
    }
    // Convert to JPY (approximate rate: 1 USD = 150 JPY)
    const jpy = Math.ceil(usd * 150);
    return `¥${jpy.toLocaleString('ja-JP')}`;
}

/**
 * Get usage percentage for UI display
 */
export function getUsagePercentage(currentCost: number, limit: number): number {
    if (limit === 0) return 0; // No limit
    return Math.min(Math.round((currentCost / limit) * 100), 100);
}
