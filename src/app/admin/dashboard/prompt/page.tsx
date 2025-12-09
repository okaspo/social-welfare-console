'use client'

import { useState, useEffect } from 'react'
import { Save, RotateCcw, AlertCircle, Check, Play, History, Star, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { JUDICIAL_SCRIVENER_PROMPT } from '@/lib/chat/system-prompt'
import { useChat } from '@ai-sdk/react'

type PromptVersion = {
    id: string
    version: number
    content: string
    description: string | null
    updated_at: string
}

export default function PromptEditorPage() {
    const [prompt, setPrompt] = useState(JUDICIAL_SCRIVENER_PROMPT)
    const [isLoading, setIsLoading] = useState(true)
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [versions, setVersions] = useState<PromptVersion[]>([])
    const [activeVersion, setActiveVersion] = useState<number>(1)
    const [description, setDescription] = useState('')

    const supabase = createClient()

    // Test Chat Hook
    const { messages, input, handleInputChange, handleSubmit, isLoading: isChatLoading, setMessages } = useChat({
        api: '/api/chat',
        body: {
            testSystemPrompt: prompt // Send current editor content as test prompt
        }
    })

    useEffect(() => {
        loadVersions()
    }, [])

    const loadVersions = async () => {
        setIsLoading(true)
        try {
            // Fetch all versions
            const { data, error } = await supabase
                .from('system_prompts')
                .select('*')
                .eq('name', 'default')
                .order('version', { ascending: false })

            if (data && data.length > 0) {
                setVersions(data)
                // Set default to latest version or active logic? 
                // For now, load the very top (latest) one into editor
                setPrompt(data[0].content)
                setActiveVersion(data[0].version) // Just a guess, ideally we know which is active. 
                // Wait, DB schema doesn't have 'is_active' column flagged per row nicely if we rely on name/version.
                // Re-reading plan: "Only one row per name can have is_active = true".
                // So let's find the active one.
                const active = data.find(v => v.is_active)
                if (active) {
                    setActiveVersion(active.version)
                    setPrompt(active.content) // Load active by default? Or latest? Usually Active.
                } else {
                    // Fallback to latest
                    setPrompt(data[0].content)
                }
            }
        } catch (e) {
            console.error('Error loading prompt', e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveNewVersion = async () => {
        setStatus('saving')
        try {
            // Determine next version number
            const nextVersion = (versions.length > 0 ? Math.max(...versions.map(v => v.version || 0)) : 0) + 1

            // Insert new version
            const { error } = await supabase
                .from('system_prompts')
                .insert({
                    name: 'default',
                    content: prompt,
                    version: nextVersion,
                    description: description || `Version ${nextVersion}`,
                    is_active: false // New versions are not active by default
                })

            if (error) throw error

            setStatus('saved')
            setDescription('')
            await loadVersions() // Reload list
            setTimeout(() => setStatus('idle'), 2000)
        } catch (e) {
            console.error(e)
            setStatus('error')
        }
    }

    const handleActivate = async (version: number) => {
        if (!confirm(`バージョン ${version} を本番環境（アクティブ）にしますか？`)) return

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
                .eq('name', 'default')
                .eq('version', version)

            alert('変更しました。')
            loadVersions()
        } catch (e) {
            console.error(e)
            alert('更新に失敗しました')
        }
    }

    const loadVersionContent = (v: PromptVersion) => {
        if (confirm('エディタの内容が上書きされます。よろしいですか？')) {
            setPrompt(v.content)
        }
    }

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6">
            {/* Left: Editor */}
            <div className="flex-1 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">AIプロンプト管理</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            システムプロンプトの編集とバージョン管理
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-gray-500" />
                            <select
                                className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                onChange={(e) => {
                                    const v = versions.find(ver => ver.id === e.target.value)
                                    if (v) loadVersionContent(v)
                                }}
                            >
                                <option value="">バージョン履歴からロード...</option>
                                {versions.map(v => (
                                    <option key={v.id} value={v.id}>
                                        v{v.version} ({new Date(v.updated_at).toLocaleDateString()}) - {v.description} {v.is_active ? '★Active' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="変更内容のメモ..."
                                className="text-sm border-gray-300 rounded-md px-2"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                            <button
                                onClick={handleSaveNewVersion}
                                disabled={status === 'saving'}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {status === 'saving' ? '保存中...' : <><Save className="h-4 w-4" /> 新規バージョン保存</>}
                            </button>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="relative border border-gray-200 rounded-md h-[500px]">
                        <textarea
                            className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            spellCheck={false}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                            {prompt.length} chars
                        </div>
                    </div>
                </div>

                {/* Versions List (Mini) */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-2">バージョン一覧</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {versions.map(v => (
                            <div key={v.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                <span className="flex items-center gap-2">
                                    <span className="font-mono font-bold">v{v.version}</span>
                                    {v.is_active && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">Active</span>}
                                    <span className="text-gray-500 text-xs">{v.description}</span>
                                </span>
                                {!v.is_active && (
                                    <button
                                        onClick={() => handleActivate(v.version)}
                                        className="text-indigo-600 hover:text-indigo-800 text-xs underline"
                                    >
                                        アクティブにする
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Test Playground */}
            <div className="w-[400px] flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Play className="h-4 w-4 text-purple-600" />
                        テストプレイグラウンド
                    </h3>
                    <button
                        onClick={() => setMessages([])}
                        className="text-xs text-gray-500 hover:text-gray-900"
                    >
                        クリア
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400 text-sm mt-10">
                            <p>エディタの内容で<br />チャットテストができます。</p>
                        </div>
                    )}
                    {messages.map(m => (
                        <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-800'
                                }`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                                <span className="animate-pulse">...</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-gray-200 bg-white">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="テストメッセージ..."
                            className="flex-1 text-sm border-gray-300 rounded-md focus:border-purple-500 focus:ring-purple-200"
                        />
                        <button
                            type="submit"
                            disabled={isChatLoading || !input.trim()}
                            className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            <MessageSquare className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
