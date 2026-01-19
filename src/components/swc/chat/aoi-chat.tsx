'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, X, Send, Paperclip, Upload, Save, Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react'
// import { processUploadedFile } from '@/lib/actions/document-processing'
import { createClient } from '@/lib/supabase/client'
import { usePrecisionCheck, type PrecisionCheckResult } from '@/hooks/use-precision-check'
import { PlanGate } from '@/components/common/plan-gate'
import { useAssistantAvatar } from '@/lib/hooks/use-assistant-avatar'

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

        /*
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
        */
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

            // 4. Read Loop - Parse AI SDK Text Stream Protocol
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })

                // AI SDK streams text in format: 0:"text content"
                // Parse each line to extract the actual text
                const lines = chunk.split('\n')
                for (const line of lines) {
                    if (!line.trim()) continue

                    // Match pattern: 0:"..." (text chunk)
                    const textMatch = line.match(/^0:"(.*)"\s*$/)
                    if (textMatch) {
                        // Unescape the JSON string content
                        try {
                            const textContent = JSON.parse(`"${textMatch[1]}"`)
                            aiContent += textContent
                        } catch {
                            // Fallback: use the matched text directly
                            aiContent += textMatch[1]
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
        <div className="fixed bottom-6 right-6 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-blue-500 text-white p-4 rounded-full"
            >
                {isOpen ? 'Close' : 'Chat'}
            </button>
            {isOpen && (
                <div className="bg-white p-4 border rounded shadow-lg mt-2">
                    Simple Chat Content
                </div>
            )}
        </div>
    )
}
