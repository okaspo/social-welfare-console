'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, X, Send, MessageSquare, Paperclip, Upload, FileText, Save, Loader2 } from 'lucide-react'
import { processUserMessage, learnDocument } from '@/lib/chat/knowledge-base'
import { processUploadedFile } from '@/lib/actions/document-processing'
import { createClient } from '@/lib/supabase/client'

interface Message {
    id: string
    role: 'user' | 'assistant'
    text: string
}

export default function AoiChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'assistant', text: 'こんにちは。S級AI事務局の葵です。何かお手伝いしましょうか？\n（例：「理事長の任期は？」や、法人の情報を教えてください）' }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

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
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: `📎 ファイルアップロード: ${file.name}` }
        setMessages(prev => [...prev, userMsg])
        setIsTyping(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const result = await processUploadedFile(formData)

            if (result.success && result.text) {
                // Learn the content
                const reply = await learnDocument(file.name, result.text)
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: reply }])
            } else {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: `申し訳ありません。ファイルの読み込みに失敗しました。\n${result.error || ''}` }])
            }
        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: 'エラーが発生しました。' }])
        } finally {
            setIsTyping(false)
        }
    }

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsTyping(true)

        // Simulate AI thinking and processing
        setTimeout(async () => {
            const responseText = await processUserMessage(userMsg.text)
            const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: responseText }
            setMessages(prev => [...prev, aiMsg])
            setIsTyping(false)
        }, 1000)
    }

    const handleSaveToKnowledge = async () => {
        if (messages.length <= 1) return
        setIsSaving(true)

        try {
            // 1. Get User Org
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single()

            if (!profile?.organization_id) throw new Error('No organization found')

            // 2. Format as Markdown
            const dateStr = new Date().toLocaleString('ja-JP')
            const title = `葵さんとのチャット履歴 (${dateStr})`
            const markdownContent = messages.map(msg => {
                const role = msg.role === 'user' ? 'ユーザー' : '葵 (AI)'
                return `**${role}**: ${msg.text}\n\n`
            }).join('---\n\n')

            // 3. Create Article (Category: CHAT_LOG)
            const { data: article, error: articleError } = await supabase
                .from('articles')
                .insert({
                    title,
                    category: 'CHAT_LOG',
                    organization_id: profile.organization_id // Strict Individual Knowledge
                })
                .select()
                .single()

            if (articleError) throw articleError

            // 4. Create Version
            const { error: versionError } = await supabase
                .from('article_versions')
                .insert({
                    article_id: article.id,
                    version_number: 1,
                    effective_date: new Date().toISOString().split('T')[0],
                    file_path: 'chat_log_auto_generated', // Placeholder or virtual
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
                    className={`mb-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200 relative ${isDragging ? 'ring-4 ring-blue-500' : ''}`}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                >
                    {/* Drag Overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 bg-blue-50/90 z-50 flex flex-col items-center justify-center text-blue-600 animate-in fade-in duration-200 pointer-events-none">
                            <Upload className="h-12 w-12 mb-2" />
                            <p className="font-bold">ファイルをここにドロップ</p>
                            <p className="text-sm">お勉強させてください！</p>
                        </div>
                    )}

                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/10 rounded-full">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">S級AI事務局 葵さん</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    <span className="text-xs text-gray-300">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSaveToKnowledge}
                                disabled={isSaving || messages.length <= 1}
                                className="p-1.5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors disabled:opacity-30"
                                title="会話をナレッジとして保存"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="h-96 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-gray-900 text-white rounded-br-none'
                                        : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-none'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
                        <div className="relative flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors"
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
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all placeholder:text-gray-400"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="p-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className="group flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-full shadow-lg hover:bg-gray-800 hover:scale-105 transition-all duration-300"
                >
                    <div className="relative">
                        <Bot className="h-6 w-6" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-gray-900 rounded-full"></span>
                    </div>
                    <span className="font-bold pr-1">葵さんに質問</span>
                </button>
            )}
        </div>
    )
}
