'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, X, Send, Paperclip, Upload, Save, Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react'
// import { processUploadedFile } from '@/lib/actions/document-processing'
import { createClient } from '@/lib/supabase/client'
// import { usePrecisionCheck, type PrecisionCheckResult } from '@/hooks/use-precision-check'
// import { PlanGate } from '@/components/common/plan-gate'
// import { useAssistantAvatar } from '@/lib/hooks/use-assistant-avatar'

// Define explicit Message type
interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    precisionCheckResult?: any // PrecisionCheckResult
}
export default function AoiChat() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Hide on the dedicated chat page to avoid redundancy
    if (pathname === '/swc/dashboard/chat') return null

    // Prevent hydration mismatch by confirming mount
    if (!isMounted) return null

    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'assistant', content: 'お疲れ様です。本日はどのような業務をお手伝いしましょうか？\n（例：「理事長の任期は？」や、法人の情報を教えてください）' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // ... file upload states ...
    const [isDragging, setIsDragging] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [showPrecisionResult, setShowPrecisionResult] = useState(false)
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null)

    // const { isChecking, result: precisionResult, checkMessage } = usePrecisionCheck()
    // const { avatarUrl } = useAssistantAvatar('aoi'); // Get Dynamic Avatar
    const avatarUrl = '/assets/avatars/aoi_face_icon.jpg'; // Static fallback for debugging

    // Dummy variables to satisfy linter while debugging
    const isChecking = false;
    const checkMessage = async (...args: any[]) => { };
    const precisionResult = null;

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    // Memoize supabase client
    const supabase = useMemo(() => createClient(), [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    const handleFileUpload = async (file: File) => {
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: `📎 ファイルアップロード: ${file.name}` }
        setMessages(prev => [...prev, userMsg])

        // Server Action temporarily disabled for debugging
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: '申し訳ありません。現在ファイルアップロード機能はメンテナンス中です。' }])
    }

    // ... drag handlers ...
    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0])
        }
    }, [])

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    // Custom Submit Handler
    const onFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        // 1. Add User Message
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInput('')
        setIsLoading(true)

        try {
            // 2. Call API
            const response = await fetch('/api/swc/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages })
            })

            if (!response.ok) {
                throw new Error(response.statusText)
            }

            if (!response.body) {
                throw new Error('No response body')
            }

            // 3. Setup Stream Reader
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let aiContent = ''
            const aiMsgId = (Date.now() + 1).toString()

            // Add placeholder AI message
            setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '' }])

            // 4. Read Loop - Parse Custom NDJSON Protocol
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (!line.trim()) continue

                    try {
                        const data = JSON.parse(line)
                        // Handle Custom NDJSON format
                        if (data.type === 'text-delta' && data.value) {
                            aiContent += data.value
                        } else if (data.type === 'error' || data.type === 'server-error') {
                            console.error('Stream Error:', data.value)
                            aiContent += `\n\n[システムエラー: ${data.value}]`
                        }
                    } catch (e) {
                        // Fallback check for AI SDK format
                        const textMatch = line.match(/^0:"(.*)"\s*$/)
                        if (textMatch) {
                            try {
                                const textContent = JSON.parse(`"${textMatch[1]}"`)
                                aiContent += textContent
                            } catch {
                                aiContent += textMatch[1]
                            }
                        }
                    }
                }

                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId ? { ...msg, content: aiContent } : msg
                ))
            }

        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: '申し訳ありません。エラーが発生しました。時間を置いて再度お試しください。'
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveToKnowledge = async () => {
        if (messages.length <= 1) return
        setIsSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single()

            if (!profile?.organization_id) throw new Error('No organization found')

            const dateStr = new Date().toLocaleString('ja-JP')

            const markdownContent = messages.map((msg) => {
                const role = msg.role === 'user' ? 'ユーザー' : '葵 (AI)'
                return `**${role}**: ${msg.content}\n\n`
            }).join('---\n\n')

            const title = `葵さんとのチャット履歴 (${dateStr})`

            const { data: article, error: articleError } = await supabase
                .from('articles')
                .insert({
                    title,
                    category: 'CHAT_LOG',
                    organization_id: profile.organization_id
                })
                .select()
                .single()

            if (articleError) throw articleError

            const { error: versionError } = await supabase
                .from('article_versions')
                .insert({
                    article_id: article.id,
                    version_number: 1,
                    effective_date: new Date().toISOString().split('T')[0],
                    file_path: 'chat_log_auto_generated',
                    changelog: 'チャット履歴から自動保存',
                    content: markdownContent
                })

            if (versionError) throw versionError

            alert('チャット履歴をナレッジとして保存しました。\n「定款・諸規程」一覧の「ナレッジ」カテゴリから確認できます。')

        } catch (error: any) {
            console.error('Save failed:', error)
            alert('保存に失敗しました: ' + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`mb-4 w-80 md:w-96 bg-[#F5F5F5] rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200 relative ${isDragging ? 'ring-4 ring-blue-400' : ''}`}
                    style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                >
                    {/* Header */}
                    <div className="bg-[#607D8B] p-4 flex items-center justify-between text-white shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm overflow-hidden border border-white/30 flex items-center justify-center">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Aoi" className="w-full h-full object-cover" />
                                    ) : (
                                        <Bot className="h-6 w-6 text-white" />
                                    )}
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#607D8B] rounded-full"></span>
                            </div>
                            <div>
                                <h3 className="font-bold text-base tracking-wide">葵さん</h3>
                                <p className="text-xs text-blue-50/80 font-light">AI Legal Partner</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* PlanGate removed for stability */}
                            <button
                                className="p-2 hover:bg-white/10 rounded-full text-white/90 hover:text-white transition-all opacity-50 cursor-not-allowed"
                                title="会話をピン留め (メンテ中)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pin"><line x1="12" x2="12" y1="17" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></svg>
                            </button>

                            <button
                                onClick={handleSaveToKnowledge}
                                disabled={isSaving || messages.length <= 1}
                                className="p-2 hover:bg-white/10 rounded-full text-white/90 hover:text-white transition-all disabled:opacity-30"
                                title="会話をナレッジとして保存"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-white/90 hover:text-white transition-all">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="h-80 overflow-y-auto p-4 space-y-6 bg-[#F5F5F5]">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white flex-shrink-0 mb-1">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Aoi" className="w-full h-full object-cover" />
                                            ) : (
                                                <Bot className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-col">
                                        <div
                                            className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user'
                                                ? 'bg-[#607D8B] text-white rounded-2xl rounded-tr-none'
                                                : 'bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start items-end gap-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white flex-shrink-0 mb-1">
                                    <Bot className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                                    <div className="flex gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={onFormSubmit} className="p-3 bg-white border-t border-gray-100">
                        <div className="relative flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-all"
                            >
                                <Paperclip className="h-5 w-5" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.docx"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                            />

                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="質問を入力..."
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#607D8B] focus:border-[#607D8B] transition-all placeholder:text-gray-400"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-2.5 bg-[#607D8B] text-white rounded-lg hover:bg-[#546E7A] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group flex items-center gap-3 bg-[#607D8B] text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Aoi" className="w-full h-full object-cover" />
                            ) : (
                                <Bot className="h-5 w-5" />
                            )}
                        </div>
                        <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#607D8B] rounded-full"></span>
                    </div>
                    <span className="font-bold tracking-wide text-sm pr-1">AOI CHAT</span>
                </button>
            )}
        </div>
    )
}
