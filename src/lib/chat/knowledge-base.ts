
export interface KnowledgeItem {
    id: string
    category: 'general' | 'organization' | 'legal'
    question: string
    answer: string
    timestamp: string
}

const MOCK_KNOWLEDGE: KnowledgeItem[] = [
    {
        id: 'k-1',
        category: 'legal',
        question: '理事の任期は？',
        answer: '社会福祉法第45条の5に基づき、選任後2年以内に終了する会計年度のうち最終のものに関する定時評議員会の終結の時までです。',
        timestamp: '2025-12-01'
    }
]

// Simulate parsing and storing
export const processUserMessage = async (message: string): Promise<string> => {
    // 1. Check if user is teaching info (e.g., "〜は〜です")
    if (message.includes('は') && message.endsWith('です')) {
        const parts = message.split('は')
        if (parts.length >= 2) {
            const subject = parts[0]
            const info = message

            // Add to mock store (in memory for this session)
            MOCK_KNOWLEDGE.push({
                id: Date.now().toString(),
                category: 'organization',
                question: subject + 'について',
                answer: info,
                timestamp: new Date().toISOString()
            })
            return `承知いたしました。「${subject}」に関する情報を知識として保存しました。`
        }
    }

    // 2. Simple Keyword Match for Q&A
    const match = MOCK_KNOWLEDGE.find(k => message.includes(k.question) || (k.question.includes(message) && message.length > 2))
    if (match) {
        return match.answer
    }

    // 3. Search in Learned Documents (Simple semantic-like match)
    const docMatch = MOCK_DOCUMENTS.find(d => d.content.includes(message) || message.split(' ').some(w => w.length > 2 && d.content.includes(w)))
    if (docMatch) {
        // Return a snippet
        const relevantPart = docMatch.content.substring(0, 200) + '...'
        return `資料「${docMatch.filename}」に関連情報がありました：\n\n${relevantPart}`
    }

    // 4. Default fallback
    return '申し訳ありません。その情報についてはまだ学習していません。「〇〇は△△です」と言っていただければ覚えます。また、資料をアップロードしていただければ読み込みます。'
}

// Store for full documents
interface DocumentKnowledge {
    id: string
    filename: string
    content: string
    timestamp: string
}
const MOCK_DOCUMENTS: DocumentKnowledge[] = []

export const learnDocument = async (filename: string, text: string): Promise<string> => {
    MOCK_DOCUMENTS.push({
        id: Date.now().toString(),
        filename,
        content: text,
        timestamp: new Date().toISOString()
    })
    return `資料「${filename}」の内容を学習しました。この資料に関する質問にお答えできます。`
}
