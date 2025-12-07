'use client'

import { useState } from 'react'
import { Edit2, Trash2, Tag, BookOpen } from 'lucide-react'
import { KnowledgeItem } from '@/lib/admin/knowledge-data'

export default function KnowledgeList({ items }: { items: KnowledgeItem[] }) {
    return (
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-medium text-gray-700">登録済み知識一覧 ({items.length})</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {items.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${item.category === 'law' ? 'bg-red-50 text-red-700 border-red-100' :
                                            item.category === 'internal_rule' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-gray-50 text-gray-700 border-gray-200'
                                        }`}>
                                        {item.category === 'law' ? '法令' : item.category === 'internal_rule' ? '内部規程' : 'その他'}
                                    </span>
                                    <h4 className="font-bold text-gray-900 line-clamp-1">{item.title}</h4>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2 bg-gray-50 p-2 rounded">
                                    {item.content}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Tag className="h-3 w-3 text-gray-400" />
                                    {item.tags.map(tag => (
                                        <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button className="p-2 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-200">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
