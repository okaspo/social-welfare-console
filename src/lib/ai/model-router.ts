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
// コスト計算
// ============================================================================

export function calculateCost(
    model: ModelName,
    inputTokens: number,
    outputTokens: number = 0
): number {
    const pricing = MODEL_PRICING[model]
    const inputCost = (inputTokens / 1_000_000) * pricing.input
    const outputCost = (outputTokens / 1_000_000) * pricing.output
    return inputCost + outputCost
}

export function formatCost(usd: number): string {
    if (usd < 0.01) return '<¥1'
    const jpy = Math.ceil(usd * 150)
    return `¥${jpy.toLocaleString('ja-JP')}`
}

export function getUsagePercentage(currentCost: number, limit: number): number {
    if (limit === 0) return 0
    return Math.min(Math.round((currentCost / limit) * 100), 100)
}

// ============================================================================
// タスク種別判定
// ============================================================================

export function detectTaskType(prompt: string, context?: string): TaskComplexity {
    const lowerPrompt = prompt.toLowerCase()

    // 簡単な挨拶
    if (
        lowerPrompt.length < 50 ||
        /^(こんにち|おはよう|こんばん|ありがとう|はい|いいえ)/.test(lowerPrompt)
    ) {
        return { type: 'simple', reason: '短い挨拶・確認' }
    }

    // 法令関連
    if (/法令|条文|法律|規則|義務|責任|社会福祉法|定款/.test(prompt)) {
        return { type: 'legal', reason: '法令・定款関連タスク' }
    }

    // リスク・コンプライアンス
    if (/リスク|懸念|問題|注意|警告|危険|違反|コンプライアンス|監査/.test(prompt)) {
        return { type: 'risk', reason: 'リスク検出・コンプライアンス' }
    }

    // 要約
    if (/要約|まとめ|概要|サマリー|ポイント/.test(prompt)) {
        return { type: 'summary', reason: '要約タスク' }
    }

    // フォーマット
    if (/フォーマット|変換|整形|テンプレート|書式|議事録/.test(prompt)) {
        return { type: 'format', reason: 'フォーマット変換' }
    }

    // 複雑な推論
    if (/なぜ|理由|分析|考察|検討|比較|評価/.test(prompt)) {
        return { type: 'reasoning', reason: '分析・推論タスク' }
    }

    // 大きなコンテキスト
    if (context && context.length > 5000) {
        return { type: 'legal', reason: '大規模コンテキスト処理' }
    }

    // デフォルト
    return { type: 'chat', reason: '通常会話' }
}

// ============================================================================
// モデルマッピング
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODEL_MAP: Record<TaskType, () => any> = {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FALLBACK_MAP: Record<TaskType, () => any> = {
    chat: () => getOpenAIProvider()('gpt-4o-mini'),
    legal: () => getOpenAIProvider()('gpt-4o'),
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getModel(taskType: TaskType): any {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFallbackModel(taskType: TaskType): any {
    return FALLBACK_MAP[taskType]()
}

/**
 * プロンプトから自動判定してモデルを選択
 * コンテキスト長が長い場合は強制的にGeminiを選択
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function selectModelFromPrompt(prompt: string, context?: string): any {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function selectModel(
    userPlan: string,
    complexity: TaskComplexity
): any { // Changed return type
    // Pro/Enterprise or long context: Use Hybrid logic
    return getModel(complexity.type)
}

// ============================================================================
// 従来互換用エクスポート
// ============================================================================

export function assessComplexity(prompt: string, context?: string): TaskComplexity {
    return detectTaskType(prompt, context)
}
