// Supervisor Pattern for Legal Checks
// Two-phase process: o1 reasoning → gpt-4o translation

import { getModelForFeature, getPromptConstraint, type FeatureName } from './model-config';

export interface LegalCheckRequest {
    feature: FeatureName;
    userPlan: string;
    context: string; // RAG context from knowledge base
    userInput: string; // User's question or data to check
    assistantPersona?: string; // 'aoi', 'aki', 'ami'
}

export interface LegalCheckResult {
    reasoning: {
        model: string;
        analysis: string;
        conclusion: 'compliant' | 'non_compliant' | 'unclear';
        citations: string[]; // Law articles referenced
        confidence: number; // 0-1
    };
    translation: {
        model: string;
        userFriendlyExplanation: string;
    };
    cost: {
        reasoningCost: number;
        translationCost: number;
        totalCost: number;
    };
}

/**
 * Execute legal check with supervisor pattern
 * Phase 1: o1 for reasoning
 * Phase 2: gpt-4o for translation
 */
export async function executeLegalCheck(
    request: LegalCheckRequest
): Promise<LegalCheckResult> {
    // Phase 0: Auto-retrieve context if missing
    let context = request.context;
    if (!context || context.trim().length === 0) {
        const { retrieveKnowledge } = await import('./rag-engine');
        context = await retrieveKnowledge(request.userInput);
    }

    // Phase 1: Reasoning with o1
    const reasoningModel = getModelForFeature(request.feature, request.userPlan);
    const reasoningPrompt = buildReasoningPrompt({ ...request, context });

    const reasoningResponse = await callAI({
        model: reasoningModel,
        prompt: reasoningPrompt,
        temperature: 0.1, // Very low for consistency
        responseFormat: 'json',
    });

    const reasoning = JSON.parse(reasoningResponse.content);

    // Phase 2: Translation with gpt-4o
    const translationModel = 'gpt-4o';
    const translationPrompt = buildTranslationPrompt(
        reasoning,
        request.assistantPersona || 'aoi'
    );

    const translationResponse = await callAI({
        model: translationModel,
        prompt: translationPrompt,
        temperature: 0.7, // Allow natural language
    });

    // Calculate costs
    const reasoningCost = calculateCost(
        reasoningModel,
        reasoningResponse.inputTokens,
        reasoningResponse.outputTokens
    );
    const translationCost = calculateCost(
        translationModel,
        translationResponse.inputTokens,
        translationResponse.outputTokens
    );

    return {
        reasoning: {
            model: reasoningModel,
            analysis: reasoning.analysis,
            conclusion: reasoning.conclusion,
            citations: reasoning.citations || [],
            confidence: reasoning.confidence || 0.9,
        },
        translation: {
            model: translationModel,
            userFriendlyExplanation: translationResponse.content,
        },
        cost: {
            reasoningCost,
            translationCost,
            totalCost: reasoningCost + translationCost,
        },
    };
}

/**
 * Build prompt for Phase 1: Reasoning
 */
function buildReasoningPrompt(request: LegalCheckRequest): string {
    const constraint = getPromptConstraint(request.feature);

    return `
You are a legal analysis engine for Japanese social welfare corporations.

${constraint}

# TASK
Analyze the following situation for legal compliance.

# KNOWLEDGE BASE (Laws and Regulations)
${request.context}

# USER INPUT
${request.userInput}

# OUTPUT FORMAT (JSON)
Return ONLY valid JSON with the following structure:
{
  "analysis": "Detailed step-by-step analysis",
  "conclusion": "compliant" | "non_compliant" | "unclear",
  "citations": ["社会福祉法第37条第1項", "..."],
  "confidence": 0.95,
  "reasoning_steps": ["Step 1: ...", "Step 2: ..."]
}

IMPORTANT:
- Base your analysis ONLY on the provided knowledge base.
- Cite specific law articles.
- If information is insufficient, set conclusion to "unclear".
- Do NOT make assumptions.
`.trim();
}

/**
 * Build prompt for Phase 2: Translation
 */
function buildTranslationPrompt(
    reasoning: any,
    persona: string
): string {
    const personaPrompts = {
        aoi: '葵（知的で落ち着いた口調、社会福祉専門）',
        aki: '秋（情熱的で親しみやすい口調、NPO専門）',
        ami: '亜美（論理的で正確な口調、医療専門）',
    };

    return `
You are ${personaPrompts[persona as keyof typeof personaPrompts] || personaPrompts.aoi}, an AI assistant.

# LEGAL ANALYSIS RESULT (From reasoning model)
${JSON.stringify(reasoning, null, 2)}

# YOUR TASK
Translate this legal analysis into user-friendly Japanese.

GUIDELINES:
- Maintain ${persona}'s personality and tone
- Explain in simple terms that non-lawyers can understand
- Do NOT add any information beyond what's in the analysis
- If analysis is "unclear", acknowledge limitations honestly
- Keep the same conclusion (compliant/non_compliant/unclear)

OUTPUT:
A natural, empathetic explanation in Japanese.
`.trim();
}

/**
 * Call OpenAI API with specified parameters
 */
async function callAI(params: {
    model: string;
    prompt: string;
    temperature: number;
    responseFormat?: 'json' | 'text';
}): Promise<{
    content: string;
    inputTokens: number;
    outputTokens: number;
}> {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages: any[] = [
        { role: 'user', content: params.prompt }
    ];

    const completion = await openai.chat.completions.create({
        model: params.model,
        messages,
        temperature: params.temperature,
        ...(params.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
    });

    return {
        content: completion.choices[0].message.content || '',
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
    };
}

/**
 * Calculate cost using pricing from model-router.ts
 */
import { MODEL_PRICING, calculateCost as calcCost } from './model-router';

/**
 * Calculate cost using pricing from model-router.ts
 */
function calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
): number {
    // Check if model exists in pricing table
    if (model in MODEL_PRICING) {
        return calcCost(model as keyof typeof MODEL_PRICING, inputTokens, outputTokens);
    }

    // Fallback for o1-preview/o1-mini not in pricing table yet
    const ADDITIONAL_PRICING: Record<string, { input: number; output: number }> = {
        'o1-preview': { input: 0.015, output: 0.060 },
        'o1-mini': { input: 0.003, output: 0.012 },
        'o3-mini': { input: 0.003, output: 0.012 },
    };

    if (model in ADDITIONAL_PRICING) {
        const pricing = ADDITIONAL_PRICING[model];
        return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
    }

    // Unknown model - return 0
    console.warn(`Unknown model pricing: ${model}`);
    return 0;
}

