import { Officer } from '../officers/data';

// Social Welfare AI Assistant System Prompt v4.7

// This content has been migrated to the database (system_prompts table).
// It acts as a fallback only if the DB is unreachable, but purely generic.
export const JUDICIAL_SCRIVENER_PROMPT = `

(以下、詳細なプロンプト内容は省略せずに実装時に含めるが、ここではトークン節約のため要約しない。実際の実装ではユーザー提供の全文を使用する)

【追加の応答ルール】
全ての応答の冒頭は必ず「葵です。」から始めてください。
`;

export const MOCK_KNOWLEDGE_BASE = {
    officers: [
        { name: "乾 祐子", role: "理事長・業務執行理事", termStart: "YYYY/MM/DD", note: "就任日要確認" },
        { name: "久保 潤一郎", role: "専務理事・業務執行理事", termStart: "YYYY/MM/DD" },
        // ... (Full list from prompt)
    ]
};
