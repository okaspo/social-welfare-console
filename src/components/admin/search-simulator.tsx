'use client'

import { useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { KnowledgeItem } from '@/lib/admin/knowledge-data'

export default function SearchSimulator({ items }: { items: KnowledgeItem[] }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<KnowledgeItem[]>([])
    const [searched, setSearched] = useState(false)

    const handleSearch = () => {
        if (!query.trim()) return

        // Simple client-side mock search simulation
        const hits = items.filter(item =>
            item.title.includes(query) ||
            item.content.includes(query) ||
            item.tags.some(t => t.includes(query))
        )
        setResults(hits)
        setSearched(true)
    }

    return (
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <h3 className="font-bold text-purple-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    AI検索シミュレーター
                </h3>
                <p className="text-xs text-purple-700 mt-1">
                    AIがどのように知識を検索・抽出するかテストできます。
                </p>
            </div>

            <div className="p-4 space-y-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="質問やキーワードを入力 (例: 役員の任期)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-bold hover:bg-purple-700 flex items-center gap-2"
                    >
                        <Search className="h-4 w-4" />
                        テスト
                    </button>
                </div>

                {searched && (
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-500 uppercase">
                            検索結果: {results.length} 件
                        </div>
                        {results.length > 0 ? (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {results.map(item => (
                                    <div key={item.id} className="p-3 bg-purple-50 rounded border border-purple-100 text-sm">
                                        <div className="font-bold text-purple-900 mb-1">{item.title}</div>
                                        <div className="text-gray-700 text-xs line-clamp-3">{item.content}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-gray-400 text-sm bg-gray-50 rounded border border-gray-100 border-dashed">
                                ヒットする知識が見つかりませんでした。
                            </div>
                        )}
                    </div>
                )}
                {!searched && (
                    <div className="p-4 text-center text-gray-400 text-xs">
                        キーワードを入力して、ライブラリからの抽出をテストしてください。
                    </div>
                )}
            </div>
        </div>
    )
}
