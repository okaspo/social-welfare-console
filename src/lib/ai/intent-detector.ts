// Intent Detection for Model Router
// Automatically detect user's intent to route to appropriate model tier

export type IntentType =
    // Tier 3: Advisor (o1) - Legal/Compliance
    | 'legal_check'
    | 'compliance_audit'
    | 'subsidy_eligibility'
    | 'governance_check'
    | 'conflict_detection'

    // Tier 2: Persona (gpt-4o) - Communication
    | 'chat'
    | 'email_draft'
    | 'minutes_draft'
    | 'explanation'

    // Tier 1: Processor (gpt-4o-mini) - Data Processing
    | 'ocr'
    | 'summarize'
    | 'tag'
    | 'extract';

export interface DetectedIntent {
    intent: IntentType;
    confidence: number; // 0-1
    reason: string;
    suggestedTier: 'processor' | 'persona' | 'advisor';
}

/**
 * Detect user intent from message content
 */
export function detectIntent(userMessage: string, conversationContext?: string[]): DetectedIntent {
    const lower = userMessage.toLowerCase();

    // Priority 1: Legal/Compliance Keywords (Advisor Tier)
    const legalKeywords = [
        '法的', '法律', '適法', '違法', '条文', '法令', '規則', '定款',
        '監事', '理事', '評議員', '役員', '兼職', '親族',
        '監査', 'チェック', '確認', '判定', '適合', '違反',
        '助成金', '補助金', '受給要件', '資格'
    ];

    for (const keyword of legalKeywords) {
        if (lower.includes(keyword)) {
            // Check for specific legal check patterns
            if (lower.includes('適法') || lower.includes('違法') || lower.includes('問題')) {
                return {
                    intent: 'legal_check',
                    confidence: 0.95,
                    reason: `Legal compliance keywords detected: ${keyword}`,
                    suggestedTier: 'advisor'
                };
            }

            if (lower.includes('助成金') || lower.includes('補助金')) {
                return {
                    intent: 'subsidy_eligibility',
                    confidence: 0.9,
                    reason: 'Subsidy eligibility check requested',
                    suggestedTier: 'advisor'
                };
            }

            if (lower.includes('役員') || lower.includes('理事') || lower.includes('監事')) {
                return {
                    intent: 'governance_check',
                    confidence: 0.9,
                    reason: 'Governance/officer check requested',
                    suggestedTier: 'advisor'
                };
            }
        }
    }

    // Priority 2: Data Processing Keywords (Processor Tier)
    const processingKeywords = {
        ocr: ['pdf', 'ファイル', 'スキャン', 'テキスト化', '読み取'],
        summarize: ['要約', 'まとめ', 'サマリ', '概要'],
        tag: ['タグ', 'カテゴリ', '分類', 'ラベル'],
        extract: ['抽出', '取り出', 'データ']
    };

    for (const [type, keywords] of Object.entries(processingKeywords)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                return {
                    intent: type as IntentType,
                    confidence: 0.85,
                    reason: `Processing task detected: ${keyword}`,
                    suggestedTier: 'processor'
                };
            }
        }
    }

    // Priority 3: Document Drafting (Persona Tier)
    const draftingKeywords = {
        email_draft: ['メール', '連絡', '通知', '招集', 'メッセージ'],
        minutes_draft: ['議事録', '会議', 'ミーティング'],
        explanation: ['説明', '解説', '教えて', 'わかりやすく']
    };

    for (const [type, keywords] of Object.entries(draftingKeywords)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword) && (lower.includes('作成') || lower.includes('書いて') || lower.includes('draft'))) {
                return {
                    intent: type as IntentType,
                    confidence: 0.8,
                    reason: `Drafting request detected: ${keyword}`,
                    suggestedTier: 'persona'
                };
            }
        }
    }

    // Priority 4: Greetings (Processor Tier - fast response)
    const greetings = ['こんにちは', 'おはよう', 'こんばんは', 'ありがとう', 'よろしく'];
    if (greetings.some(g => lower.startsWith(g)) && userMessage.length < 30) {
        return {
            intent: 'chat',
            confidence: 0.95,
            reason: 'Simple greeting detected',
            suggestedTier: 'processor'
        };
    }

    // Default: General chat (Persona Tier)
    return {
        intent: 'chat',
        confidence: 0.7,
        reason: 'General conversation',
        suggestedTier: 'persona'
    };
}

/**
 * Map intent to specific feature name for model-config.ts
 */
export function mapIntentToFeature(intent: IntentType): import('./model-config').FeatureName {
    const mapping: Record<IntentType, import('./model-config').FeatureName> = {
        // Advisor
        legal_check: 'governance_check',
        compliance_audit: 'governance_check',
        subsidy_eligibility: 'subsidy_eligibility',
        governance_check: 'governance_check',
        conflict_detection: 'conflict_of_interest',

        // Persona
        chat: 'chat_response',
        email_draft: 'drafting_emails',
        minutes_draft: 'drafting_minutes',
        explanation: 'explain_legal_result',

        // Processor
        ocr: 'pdf_ocr',
        summarize: 'summarize_daily_report',
        tag: 'tagging',
        extract: 'extract_entities',
    };

    return mapping[intent];
}

/**
 * Check if intent requires o1 quota check
 */
export function requiresO1(intent: IntentType): boolean {
    const o1Intents: IntentType[] = [
        'legal_check',
        'compliance_audit',
        'subsidy_eligibility',
        'governance_check',
        'conflict_detection'
    ];

    return o1Intents.includes(intent);
}
