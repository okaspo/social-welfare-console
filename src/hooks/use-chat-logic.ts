'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt?: Date
}

export interface UseChatLogicOptions {
    personaId?: string
    personaName?: string
    initialMessages?: ChatMessage[]
    onError?: (error: Error) => void
}

export interface UseChatLogicReturn {
    messages: ChatMessage[]
    input: string
    setInput: (value: string) => void
    isLoading: boolean
    error: Error | null
    sendMessage: (content?: string) => Promise<void>
    clearMessages: () => void
    saveToDocuments: (title?: string) => Promise<{ success: boolean; documentId?: string; error?: string }>
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useChatLogic(options: UseChatLogicOptions = {}): UseChatLogicReturn {
    const {
        personaId = 'aoi',
        personaName = '葵',
        initialMessages = [
            { id: 'welcome', role: 'assistant', content: 'お疲れ様です。本日はどのような業務をお手伝いしましょうか？' }
        ],
        onError
    } = options

    // ========================================================================
    // State - All hooks MUST be at the top level, unconditionally
    // ========================================================================
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // Refs
    const abortControllerRef = useRef<AbortController | null>(null)
    const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

    // ========================================================================
    // Lazy Supabase client initialization
    // ========================================================================
    const getSupabase = useCallback(() => {
        if (!supabaseRef.current) {
            supabaseRef.current = createClient()
        }
        return supabaseRef.current
    }, [])

    // ========================================================================
    // Cleanup on unmount
    // ========================================================================
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    // ========================================================================
    // Send Message Handler
    // ========================================================================
    const sendMessage = useCallback(async (content?: string) => {
        const messageContent = content || input.trim()
        if (!messageContent || isLoading) return

        // Clear input immediately
        setInput('')
        setError(null)

        // Create user message
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageContent,
            createdAt: new Date()
        }

        // Add user message to state
        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setIsLoading(true)

        // Create placeholder for AI response
        const aiMessageId = `assistant-${Date.now()}`
        setMessages(prev => [...prev, { id: aiMessageId, role: 'assistant', content: '', createdAt: new Date() }])

        try {
            // Abort any previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
            abortControllerRef.current = new AbortController()

            // Call API
            const response = await fetch('/api/swc/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages,
                    personaId
                }),
                signal: abortControllerRef.current.signal
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`API Error: ${response.status} - ${errorText}`)
            }

            if (!response.body) {
                throw new Error('No response body')
            }

            // Stream reading
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let aiContent = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (!line.trim()) continue

                    try {
                        const data = JSON.parse(line)

                        // Handle our NDJSON format
                        if (data.type === 'text-delta' && data.value) {
                            aiContent += data.value
                        } else if (data.type === 'error' || data.type === 'server-error') {
                            console.error('Stream Error:', data.value)
                            aiContent += `\n\n[エラー: ${data.value}]`
                        }
                    } catch {
                        // Try AI SDK format fallback
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

                // Update AI message content
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId ? { ...msg, content: aiContent } : msg
                ))
            }

        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // Request was cancelled, ignore
                return
            }

            const error = err instanceof Error ? err : new Error('Unknown error')
            setError(error)
            onError?.(error)

            // Update AI message with error
            setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId
                    ? { ...msg, content: '申し訳ありません。エラーが発生しました。時間を置いて再度お試しください。' }
                    : msg
            ))
        } finally {
            setIsLoading(false)
            abortControllerRef.current = null
        }
    }, [input, isLoading, messages, personaId, onError])

    // ========================================================================
    // Clear Messages
    // ========================================================================
    const clearMessages = useCallback(() => {
        setMessages(initialMessages)
        setError(null)
    }, [initialMessages])

    // ========================================================================
    // Save to Documents
    // ========================================================================
    const saveToDocuments = useCallback(async (title?: string): Promise<{ success: boolean; documentId?: string; error?: string }> => {
        if (messages.length <= 1) {
            return { success: false, error: '保存する会話がありません' }
        }

        try {
            const supabase = getSupabase()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                return { success: false, error: '認証されていません' }
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single()

            if (!profile?.organization_id) {
                return { success: false, error: '組織が見つかりません' }
            }

            const dateStr = new Date().toLocaleString('ja-JP')
            const documentTitle = title || `${personaName}さんとのチャット履歴 (${dateStr})`

            // Convert messages to Markdown
            const markdownContent = messages.map(msg => {
                const role = msg.role === 'user' ? 'ユーザー' : `${personaName} (AI)`
                return `**${role}**: ${msg.content}\n\n`
            }).join('---\n\n')

            // Save to documents table
            const { data: document, error: docError } = await supabase
                .from('documents')
                .insert({
                    title: documentTitle,
                    content: markdownContent,
                    document_type: 'CHAT_GENERATED',
                    organization_id: profile.organization_id,
                    created_by: user.id
                })
                .select('id')
                .single()

            if (docError) {
                // Fallback: Try articles table if documents doesn't exist
                const { data: article, error: articleError } = await supabase
                    .from('articles')
                    .insert({
                        title: documentTitle,
                        category: 'CHAT_LOG',
                        organization_id: profile.organization_id
                    })
                    .select('id')
                    .single()

                if (articleError) {
                    throw articleError
                }

                // Also save content to article_versions
                await supabase.from('article_versions').insert({
                    article_id: article.id,
                    version_number: 1,
                    effective_date: new Date().toISOString().split('T')[0],
                    file_path: 'chat_log_auto_generated',
                    changelog: 'チャット履歴から自動保存',
                    content: markdownContent
                })

                return { success: true, documentId: article.id }
            }

            return { success: true, documentId: document.id }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '保存に失敗しました'
            return { success: false, error: errorMessage }
        }
    }, [messages, personaName, getSupabase])

    // ========================================================================
    // Return
    // ========================================================================
    return {
        messages,
        input,
        setInput,
        isLoading,
        error,
        sendMessage,
        clearMessages,
        saveToDocuments
    }
}
