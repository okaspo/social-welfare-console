// Zero-Hallucination Model Configuration
// Strict model assignment by feature to minimize hallucination risk

export const MODEL_TIERS = {
    // Tier 3: High-Logic / Legal Check (Use o1 or o3)
    // Hallucination is NOT acceptable. Use reasoning models.
    REASONING: {
        models: ['o1-preview', 'o1-mini', 'o3-mini'] as const,
        features: [
            'governance_check',      // Officer composition legality check
            'subsidy_eligibility',   // Subsidy eligibility determination
            'article_validation',    // Articles vs. law contradiction check
            'conflict_of_interest',  // Conflict of interest determination
        ] as const,
        requiresRAG: true,
        allowCreativity: false,
    },

    // Tier 2: Communication / Context (Use gpt-4o)
    // Maintain assistant personality while staying factual
    COMMUNICATION: {
        models: ['gpt-4o'] as const,
        features: [
            'chat_response',         // Normal dialogue and consultation
            'drafting_emails',       // Convocation notices and emails
            'drafting_minutes',      // Meeting minutes formatting
            'explain_legal_result',  // Translate legal findings to user-friendly language
        ] as const,
        requiresRAG: true,
        allowCreativity: true, // For natural language only
    },

    // Tier 1: Processing / Extraction (Use gpt-4o-mini)
    // High-volume data processing tasks
    PROCESSING: {
        models: ['gpt-4o-mini'] as const,
        features: [
            'pdf_ocr',              // PDF text extraction
            'summarize_daily_report', // Daily report summarization
            'tagging',              // Document categorization
            'extract_entities',     // Entity extraction
        ] as const,
        requiresRAG: false,
        allowCreativity: false,
    },
} as const;

export type FeatureName =
    | typeof MODEL_TIERS.REASONING.features[number]
    | typeof MODEL_TIERS.COMMUNICATION.features[number]
    | typeof MODEL_TIERS.PROCESSING.features[number];

export type ModelTier = keyof typeof MODEL_TIERS;

/**
 * Get model tier for a feature
 */
export function getModelTier(feature: FeatureName): ModelTier {
    for (const [tier, config] of Object.entries(MODEL_TIERS)) {
        if (config.features.includes(feature as any)) {
            return tier as ModelTier;
        }
    }
    throw new Error(`Unknown feature: ${feature}`);
}

/**
 * Get model for a specific feature
 */
export function getModelForFeature(
    feature: FeatureName,
    userPlan: string = 'standard'
): string {
    const tier = getModelTier(feature);
    const config = MODEL_TIERS[tier];

    // Enterprise gets best models
    if (userPlan === 'enterprise') {
        return config.models[0];
    }

    // Pro gets tier-appropriate models
    if (userPlan === 'pro') {
        if (tier === 'REASONING') {
            return 'o1-mini'; // Cheaper reasoning model for Pro
        }
        return config.models[0];
    }

    // Standard: Limited access
    if (tier === 'REASONING') {
        throw new Error('Legal check features require Pro plan or higher');
    }

    if (tier === 'COMMUNICATION') {
        return 'gpt-4o-mini'; // Downgrade to mini for Standard
    }

    return config.models[0];
}

/**
 * Check if feature requires RAG context
 */
export function requiresRAG(feature: FeatureName): boolean {
    const tier = getModelTier(feature);
    return MODEL_TIERS[tier].requiresRAG;
}

/**
 * Get system prompt constraint for feature
 */
export function getPromptConstraint(feature: FeatureName): string {
    const tier = getModelTier(feature);
    const config = MODEL_TIERS[tier];

    if (!config.allowCreativity) {
        return `
CRITICAL CONSTRAINT:
- Do NOT create, invent, or assume any information.
- Only use facts explicitly provided in the context.
- If information is missing, say "情報が不足しています" and do NOT guess.
- For legal matters, cite specific laws and articles.
`;
    }

    if (tier === 'COMMUNICATION') {
        return `
COMMUNICATION GUIDELINES:
- Maintain the assistant's personality (empathetic, professional).
- Use provided facts only. Do not add unverified information.
- If uncertain, acknowledge limitations clearly.
`;
    }

    return '';
}
