export interface KnowledgeItem {
    id: string
    title: string
    content: string
    category: 'law' | 'internal_rule' | 'faq' | 'other'
    tags: string[]
    isActive: boolean
    createdAt: string
}

export const MOCK_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
    {
        id: '1',
        title: '社会福祉法 第45条の13 (役員の任期)',
        content: '役員の任期は、二年を超えることはできない。ただし、再任を妨げない。2 定款で、前項の任期を二年より短い期間に定めることを妨げない。',
        category: 'law',
        tags: ['役員', '任期', '法律'],
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: '2',
        title: '旅費規程 第3条 (出張の定義)',
        content: '本規程において「出張」とは、業務の遂行のため、通常の勤務地を離れて旅行することをいう。',
        category: 'internal_rule',
        tags: ['経理', '出張', '規程'],
        isActive: true,
        createdAt: '2024-02-15T00:00:00Z'
    },
    {
        id: '3',
        title: 'Q. 評議員会はいつ開催すべきですか？',
        content: 'A. 定時評議員会は、毎会計年度終了後一定の時期（通常は6月）に招集しなければなりません。',
        category: 'faq',
        tags: ['評議員会', '運営'],
        isActive: true,
        createdAt: '2024-03-10T00:00:00Z'
    }
]
