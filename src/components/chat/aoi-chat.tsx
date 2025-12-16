'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, X, Send, Paperclip, Upload, Save, Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react'
import { processUploadedFile } from '@/lib/actions/document-processing'
import { createClient } from '@/lib/supabase/client'
import { usePrecisionCheck, type PrecisionCheckResult } from '@/hooks/use-precision-check'

// Define explicit Message type
interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    precisionCheckResult?: PrecisionCheckResult
}

export default function AoiChat() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    // Hide on the dedicated chat page to avoid redundancy
    if (pathname === '/dashboard/chat') return null

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

    const { isChecking, result: precisionResult, checkMessage } = usePrecisionCheck()

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    const handleFileUpload = async (file: File) => {
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: `📎 ファイルアップロード: ${file.name}` }
        setMessages(prev => [...prev, userMsg])

        try {
            const formData = new FormData()
            formData.append('file', file)

            const result = await processUploadedFile(formData)

            if (result.success && result.text) {
                const reply = `資料「${file.name}」の内容を読み込みました（※現在は会話コンテキストには追加されません）。`
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: reply }])
            } else {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `申し訳ありません。ファイルの読み込みに失敗しました。\n${result.error || ''}` }])
            }
        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'エラーが発生しました。' }])
        }
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
            const response = await fetch('/api/chat', {
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

            // 4. Read Loop
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                // Simple stream handling (assuming raw text or simple format for now)
                // If the API returns Vercel AI SDK format (0:"text"), it might need parsing.
                // But generally /api/chat with streamText returns raw tokens if configured simply,
                // or Vercel protocol strings.

                // Let's assume standard text stream for robust display, but check for Vercel format.
                // Vercel protocol often looks like '0:"Hello"\n0:"World"'
                // For now, let's just append the chunk. If it looks garbage (like 0:".."), we'll refine the parser.
                // Actually, if we use streamText simply, it streams raw text usually unless using Data Stream Protocol.

                // Temporary robust logic: Accumulate raw text. 
                // If it contains protocol headers, the user will see them, but at least SOMETHING appears.
                // We will clean it up if needed.

                aiContent += chunk

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
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`mb-4 w-72 md:w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200 relative ${isDragging ? 'ring-4 ring-blue-400' : ''}`}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                >
                    {/* Drag overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 bg-blue-50/95 z-50 flex flex-col items-center justify-center text-blue-600 animate-in fade-in duration-200 pointer-events-none">
                            <Upload className="h-12 w-12 mb-3" />
                            <p className="font-bold text-lg">ファイルをここにドロップ</p>
                            <p className="text-sm text-blue-500">お勉強させてください!</p>
                        </div>
                    )}

                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-3 flex items-center justify-between text-white shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base">葵さん</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-sm"></span>
                                    <span className="text-xs text-gray-200">オンライン</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSaveToKnowledge}
                                disabled={isSaving || messages.length <= 1}
                                className="p-2 hover:bg-white/15 rounded-lg text-gray-200 hover:text-white transition-all disabled:opacity-30"
                                title="会話をナレッジとして保存"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/15 rounded-lg text-gray-200 hover:text-white transition-all">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="h-72 overflow-y-auto p-4 bg-gradient-to-b from-gray-50/30 to-white space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-start gap-2 max-w-[85%]">
                                    <div
                                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-gray-800 to-gray-700 text-white rounded-br-md'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>

                                    {/* Precision Check Button (AI messages only) */}
                                    {msg.role === 'assistant' && msg.id !== 'welcome' && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    setActiveMessageId(msg.id);
                                                    await checkMessage(msg.id, messages);
                                                    setShowPrecisionResult(true);
                                                } catch (error: any) {
                                                    alert('精密チェックに失敗しました: ' + error.message);
                                                }
                                            }}
                                            disabled={isChecking && activeMessageId === msg.id}
                                            className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                                            title="🔍 o1で精密チェック"
                                        >
                                            {isChecking && activeMessageId === msg.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Search className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Precision Check Result */}
                                {msg.precisionCheckResult && (
                                    <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs max-w-[85%]">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            {msg.precisionCheckResult.verified ? (
                                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                            ) : (
                                                <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
                                            )}
                                            <span className="font-semibold text-gray-700">
                                                精密チェック結果 (o1)
                                            </span>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed">
                                            {msg.precisionCheckResult.explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={onFormSubmit} className="p-3 bg-white border-t border-gray-100 shadow-inner">
                        <div className="relative flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:text-gray-800 transition-all"
                            >
                                <Paperclip className="h-4 w-4" />
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
                                placeholder="質問や情報を入力..."
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-transparent transition-all placeholder:text-gray-400"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group flex items-center gap-3 bg-gradient-to-r from-gray-800 to-gray-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                    <div className="relative">
                        <Bot className="h-6 w-6" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full shadow-sm"></span>
                    </div>
                    <span className="font-bold pr-1">葵さんに質問</span>
                </button>
            )}
        </div>
    )
}
