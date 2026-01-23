/**
 * AI Model Router - タスク種別に応じた最適なAIモデルを選択
 * 
 * Gemini 2.0 Flash: コスト最適化（通常会話、要約、フォーマット）
 * GPT-4o: 精度重視（法令解釈、リスク検出）
 * Gemini 2.0 Flash Thinking: 推論タスク（分析、検討）
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'

// ============================================================================
// Provider初期化（遅延評価）
// ============================================================================

const getGoogleProvider = () => createGoogleGenerativeAI({
    apiKey: (process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').replace(/[\s\u200B-\u200D\uFEFF]/g, ''),
})

const getOpenAIProvider = () => createOpenAI({
    apiKey: (process.env.OPENAI_API_KEY || '').replace(/[\s\u200B-\u200D\uFEFF]/g, ''),
})

// ============================================================================
// 型定義
// ============================================================================

export type TaskType =
    | 'chat'           // 通常会話 → Gemini Flash
    | 'legal'          // 法令解釈 → GPT-4o
    | 'risk'           // リスク検出 → GPT-4o
    | 'summary'        // 要約 → Gemini Flash
    | 'format'         // フォーマット変換 → Gemini Flash
    | 'reasoning'      // 複雑な推論 → Gemini Thinking
    | 'simple'         // 簡単な挨拶 → GPT-4o-mini

export interface TaskComplexity {
    type: TaskType
    reason?: string
}

// ============================================================================
// モデル価格情報（1M tokens, USD）
// ============================================================================

export const MODEL_PRICING = {
    'gpt-4o': { input: 0.0025, output: 0.010 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'o1-preview': { input: 0.015, output: 0.060 },
    'gemini-2.0-flash': { input: 0.000075, output: 0.0003 },
    'gemini-2.0-flash-thinking-exp': { input: 0.0001, output: 0.0004 },
    'text-embedding-3-small': { input: 0.00002, output: 0 },
} as const

export type ModelName = keyof typeof MODEL_PRICING

// ============================================================================
// モデルマッピング
// ============================================================================

// ============================================================================
// モデルマッピング
// ============================================================================

const MODEL_MAP: Record<TaskType, () => LanguageModel> = {
    // Hybrid Strategy: Use Gemini for cost/speed, OpenAI for precision
    chat: () => getGoogleProvider()('gemini-2.0-flash'),
    legal: () => getOpenAIProvider()('gpt-4o'),
    risk: () => getOpenAIProvider()('gpt-4o'),
    summary: () => getGoogleProvider()('gemini-2.0-flash'),
    format: () => getGoogleProvider()('gemini-2.0-flash'),
    reasoning: () => getGoogleProvider()('gemini-2.0-flash-thinking-exp'),
    simple: () => getOpenAIProvider()('gpt-4o-mini'),
}

// Fallback models for when primary fails
const FALLBACK_MAP: Record<TaskType, () => LanguageModel> = {
    chat: () => getOpenAIProvider()('gpt-4o-mini'),
    legal: () => getOpenAIProvider()('gpt-4o'), // No fallback for precision tasks? Or maybe 4o-mini? Keeping 4o for safety
    risk: () => getOpenAIProvider()('gpt-4o'),
    summary: () => getOpenAIProvider()('gpt-4o-mini'),
    format: () => getOpenAIProvider()('gpt-4o-mini'),
    reasoning: () => getOpenAIProvider()('gpt-4o'),
    simple: () => getOpenAIProvider()('gpt-4o-mini'),
}

// ============================================================================
// モデル選択（メイン関数）
// ============================================================================

/**
 * タスク種別に応じた最適なモデルを選択
 */
export function getModel(taskType: TaskType): LanguageModel {
    const modelFactory = MODEL_MAP[taskType]
    if (!modelFactory) {
        console.warn(`[ModelRouter] Unknown task type: ${taskType}, falling back to chat`)
        return MODEL_MAP.chat()
    }
    return modelFactory()
}

/**
 * フォールバック用モデルを取得
 */
export function getFallbackModel(taskType: TaskType): LanguageModel {
    return FALLBACK_MAP[taskType]()
}

/**
 * プロンプトから自動判定してモデルを選択
 * コンテキスト長が長い場合は強制的にGeminiを選択
 */
export function selectModelFromPrompt(prompt: string, context?: string): LanguageModel {
    const complexity = detectTaskType(prompt, context)

    // Check context length - if > 30k chars, force Gemini for 1M context window
    if (context && context.length > 30000) {
        console.log(`[ModelRouter] Large context detected (${context.length} chars), forcing Gemini`)
        return getGoogleProvider()('gemini-2.0-flash')
    }

    console.log(`[ModelRouter] Task: ${complexity.type} (${complexity.reason}), Prompt: "${prompt.slice(0, 50)}..."`)
    return getModel(complexity.type)
}

/**
 * 旧関数互換用: 使用箇所がある場合は修正推奨だが、一旦残す
 * ただし戻り値は ModelName 文字列ではなくなっているので注意が必要。
 * route.ts 側でこれを使っているなら修正が必要。
 */
export function selectModel(
    userPlan: string,
    complexity: TaskComplexity
): LanguageModel { // Changed return type
    // Pro/Enterprise or long context: Use Hybrid logic
    return getModel(complexity.type)
}

// ============================================================================
// 従来互換用エクスポート
// ============================================================================

export function assessComplexity(prompt: string, context?: string): TaskComplexity {
    return detectTaskType(prompt, context)
}
