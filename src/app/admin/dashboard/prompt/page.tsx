'use client'

import { useState, useEffect } from 'react'
import { Save, RotateCcw, AlertCircle, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { JUDICIAL_SCRIVENER_PROMPT } from '@/lib/chat/system-prompt'

export default function PromptEditorPage() {
    const [prompt, setPrompt] = useState(JUDICIAL_SCRIVENER_PROMPT)
    const [isLoading, setIsLoading] = useState(true)
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

    const supabase = createClient()

    useEffect(() => {
        loadPrompt()
    }, [])

    const loadPrompt = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('system_prompts')
                .select('content')
                .eq('name', 'default')
                .maybeSingle() // Use maybeSingle to avoid 406 error if 0 rows

            if (data) {
                setPrompt(data.content)
            } else {
                // No DB entry yet, use code default (already set)
            }
        } catch (e) {
            console.error('Error loading prompt', e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setStatus('saving')
        try {
            // Upsert based on name 'default'
            // We need to first check if it exists to get ID or just rely on name constraint if we had one.
            // For simplicity, we'll try to update, if 0 rows, we insert.

            const { data: existing } = await supabase
                .from('system_prompts')
                .select('id')
                .eq('name', 'default')
                .maybeSingle()

            if (existing) {
                await supabase
                    .from('system_prompts')
                    .update({ content: prompt, updated_at: new Date().toISOString() })
                    .eq('id', existing.id)
            } else {
                await supabase
                    .from('system_prompts')
                    .insert({ name: 'default', content: prompt, is_active: true })
            }

            setStatus('saved')
            setTimeout(() => setStatus('idle'), 2000)
        } catch (e) {
            console.error(e)
            setStatus('error')
        }
    }

    const handleReset = () => {
        if (confirm('デフォルト（コード定義）のプロンプトに戻しますか？')) {
            setPrompt(JUDICIAL_SCRIVENER_PROMPT)
        }
    }

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">AIプロンプト管理</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        AI（葵さん）の振る舞いを定義するシステムプロンプトを編集します。
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors"
                    >
                        <RotateCcw className="h-4 w-4" />
                        デフォルトに戻す
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={status === 'saving'}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                        {status === 'saving' ? (
                            <span className="animate-pulse">保存中...</span>
                        ) : status === 'saved' ? (
                            <>
                                <Check className="h-4 w-4" />
                                保存完了
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                保存する
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-mono text-gray-500 flex justify-between">
                    <span>SYSTEM_PROMPT</span>
                    <span>{prompt.length} chars</span>
                </div>
                <textarea
                    className="flex-1 p-4 w-full h-full font-mono text-sm resize-none focus:outline-none focus:ring-0"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    spellCheck={false}
                />
            </div>

            {status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    保存に失敗しました。DB接続を確認してください。
                </div>
            )}
        </div>
    )
}
