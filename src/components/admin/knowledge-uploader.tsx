'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Loader2, Plus } from 'lucide-react'

export default function KnowledgeUploader() {
    const [isOpen, setIsOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('law')
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleSave = async () => {
        if (!title || !content) return alert('タイトルと内容を入力してください')

        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('knowledge_items')
                .insert({
                    title,
                    content,
                    category,
                    is_active: true,
                    tags: []
                })

            if (error) throw error

            // Reset and refresh
            setTitle('')
            setContent('')
            setIsOpen(false)
            window.location.reload() // Simple refresh
        } catch (e: any) {
            console.error(e)
            alert('保存エラー: ' + e.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-white border border-gray-200 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all"
            >
                <Plus className="h-8 w-8 mb-2" />
                <span className="font-medium">新しい知識を追加</span>
            </button>
        )
    }

    return (
        <div className="bg-white border border-indigo-100 rounded-lg shadow-sm p-6 space-y-4 ring-2 ring-indigo-50">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">新規知識登録</h3>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">タイトル</label>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="例：理事会の開催頻度について"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">カテゴリ</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                        <option value="law">法令・通知</option>
                        <option value="internal_rule">内部規程</option>
                        <option value="faq">FAQ・運用</option>
                        <option value="other">その他</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">内容 (Markdown対応)</label>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="知識の詳細内容を入力..."
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-gray-500 text-sm hover:bg-gray-100 rounded-md"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        登録する
                    </button>
                </div>
            </div>
        </div>
    )
}
