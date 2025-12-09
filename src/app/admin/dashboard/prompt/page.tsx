'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, RotateCcw, AlertCircle, Check, Play, History, Monitor } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { JUDICIAL_SCRIVENER_PROMPT } from '@/lib/chat/system-prompt'
import { useChat } from '@ai-sdk/react'

type PromptVersion = {
    id: string
    name: string
    version: number
    content: string
    changelog: string
    is_active: boolean
    created_at: string
}

export default function PromptEditorPage() {
    const [prompt, setPrompt] = useState(JUDICIAL_SCRIVENER_PROMPT)
    const [versions, setVersions] = useState<PromptVersion[]>([])
    const [activeVersion, setActiveVersion] = useState<PromptVersion | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [mode, setMode] = useState<'editor' | 'playground'>('editor')
    const [changelog, setChangelog] = useState('')
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

    const supabase = createClient()

    // Playground Chat Hook
    const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
        api: '/api/chat/test',
        body: { systemPrompt: prompt }
    } as any) as any

    useEffect(() => {
        loadVersions()
    }, [])

    const loadVersions = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from('system_prompts')
                .select('*')
                .eq('name', 'default')
                .order('version', { ascending: false })

            if (data && data.length > 0) {
                setVersions(data)
                // Find active or use latest
                const active = data.find(v => v.is_active)
                if (active) {
                    setActiveVersion(active)
                    setPrompt(active.content)
                } else {
                    // If no active, use latest
                    setPrompt(data[0].content)
                }
            } else {
                // No versions yet
            }
        } catch (e) {
            console.error('Error loading prompts', e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!changelog.trim()) {
            alert('変更内容（Changelog）を入力してください')
            return
        }

        setStatus('saving')
        try {
            // Determine next version
            const nextVersion = (versions.length > 0 ? versions[0].version : 0) + 1

            // 1. Insert New Version
            const { error } = await supabase
                .from('system_prompts')
                .insert({
                    name: 'default',
                    content: prompt,
                    version: nextVersion,
                    changelog: changelog,
                    is_active: false // New versions are inactive by default? Or active? Let's say inactive until "Activated"
                })

            if (error) throw error

            setStatus('saved')
            setChangelog('')
            await loadVersions() // Reload list
            setTimeout(() => setStatus('idle'), 2000)
        } catch (e) {
            console.error(e)
            setStatus('error')
        }
    }

    const handleActivate = async (versionId: string) => {
        if (!confirm('このバージョンを本番環境（Active）に適用しますか？')) return

        try {
            // 1. Deactivate all
            await supabase
                .from('system_prompts')
                .update({ is_active: false })
                .eq('name', 'default')

            // 2. Activate target
            await supabase
                .from('system_prompts')
                .update({ is_active: true })
                .eq('id', versionId)

            await loadVersions()
        } catch (e) {
            console.error(e)
            alert('有効化に失敗しました')
        }
    }

    const loadVersionContent = (v: PromptVersion) => {
        if (confirm('エディタの内容が上書きされます。よろしいですか？')) {
            setPrompt(v.content)
        }
    }

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6">

            {/* Left: Version History */}
            <div className="w-64 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-3 bg-gray-50 border-b border-gray-100 font-medium text-xs text-gray-500 uppercase flex items-center gap-2">
                    <History className="h-3 w-3" />
                    Version History
                </div>
                <div className="flex-1 overflow-y-auto">
                    {versions.map(v => (
                        <div key={v.id} className={`p-3 border-b border-gray-100 text-sm hover:bg-gray-50 cursor-pointer ${v.is_active ? 'bg-indigo-50 hover:bg-indigo-100' : ''}`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-gray-700">v{v.version}</span>
                                {v.is_active && <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] rounded-full">Active</span>}
                            </div>
                            <div className="text-gray-500 text-xs mb-2 line-clamp-1">{v.changelog || 'No changelog'}</div>
                            <div className="flex gap-2">
                                <button onClick={() => loadVersionContent(v)} className="text-xs text-blue-600 hover:underline">Load</button>
                                {!v.is_active && (
                                    <button onClick={() => handleActivate(v.id)} className="text-xs text-green-600 hover:underline">Activate</button>
                                )}
                            </div>
                        </div>
                    ))}
                    {versions.length === 0 && <div className="p-4 text-xs text-gray-400">履歴なし</div>}
                </div>
            </div>

            {/* Center/Right: Main Content */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">AIプロンプト管理</h1>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setMode('editor')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'editor' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            エディタ
                        </button>
                        <button
                            onClick={() => setMode('playground')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${mode === 'playground' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Play className="h-3 w-3" />
                            テスト実行 (Playground)
                        </button>
                    </div>
                </div>

                {mode === 'editor' ? (
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden relative">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-mono text-gray-500 flex justify-between">
                                <span>SYSTEM_PROMPT (Editing)</span>
                                <span>{prompt.length} chars</span>
                            </div>
                            <textarea
                                className="flex-1 p-4 w-full h-full font-mono text-sm resize-none focus:outline-none focus:ring-0"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                spellCheck={false}
                            />
                        </div>

                        {/* Save Area */}
                        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm flex gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium text-gray-700">変更内容 (Changelog)</label>
                                <input
                                    type="text"
                                    value={changelog}
                                    onChange={(e) => setChangelog(e.target.value)}
                                    placeholder="例: 文言を修正しました"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={status === 'saving'}
                                className="h-10 px-6 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                            >
                                {status === 'saving' ? '保存中...' : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        新バージョンとして保存
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
                        <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2 text-indigo-700 text-sm font-medium">
                            <Monitor className="h-4 w-4" />
                            Playground Mode - 現在のエディタの内容で動作確認します
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {messages.map((m: any) => (
                                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-800'
                                        }`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                            <input
                                value={input}
                                onChange={handleInputChange}
                                placeholder="テストメッセージを入力..."
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                                送信
                            </button>
                            <button type="button" onClick={() => setMessages([])} className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                                クリア
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
