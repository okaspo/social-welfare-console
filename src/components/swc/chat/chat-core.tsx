'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Bot, X, Send, Paperclip, Save, Loader2, Trash2 } from 'lucide-react'
import { useChatLogic, type ChatMessage, type UseChatLogicOptions } from '@/hooks/use-chat-logic'

// ============================================================================
// Types
// ============================================================================

export interface ChatCoreProps extends UseChatLogicOptions {
    // Layout variants
    variant?: 'popup' | 'fullpage'

    // Appearance
    avatarUrl?: string
    showHeader?: boolean
    showSaveButton?: boolean
    showClearButton?: boolean

    // Popup specific
    onClose?: () => void

    // Custom class names
    className?: string
    messagesClassName?: string
    inputClassName?: string
}

// ============================================================================
// Component
// ============================================================================

export default function ChatCore({
    variant = 'popup',
    avatarUrl = '/assets/avatars/aoi_face_icon.jpg',
    showHeader = true,
    showSaveButton = true,
    showClearButton = false,
    onClose,
    className = '',
    messagesClassName = '',
    inputClassName = '',
    ...chatOptions
}: ChatCoreProps) {
    const {
        messages,
        input,
        setInput,
        isLoading,
        sendMessage,
        clearMessages,
        saveToDocuments
    } = useChatLogic(chatOptions)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    // Handle form submit
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        sendMessage()
    }, [sendMessage])

    // Handle Enter key (Shift+Enter for newline)
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }, [sendMessage])

    // Auto-resize textarea
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        // Auto-resize
        const textarea = e.target
        textarea.style.height = 'auto'
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }, [setInput])

    // Handle save
    const handleSave = useCallback(async () => {
        const result = await saveToDocuments()
        if (result.success) {
            alert('チャット履歴を保存しました。\n「書類管理」ページから確認できます。')
        } else {
            alert('保存に失敗しました: ' + result.error)
        }
    }, [saveToDocuments])

    // Handle file upload (placeholder for now)
    const handleFileUpload = useCallback((file: File) => {
        // TODO: Implement file upload
        alert(`ファイルアップロード機能は準備中です: ${file.name}`)
    }, [])

    // ========================================================================
    // Styles based on variant
    // ========================================================================
    const isFullPage = variant === 'fullpage'

    const containerStyles = isFullPage
        ? 'flex flex-col h-full bg-white'
        : 'flex flex-col h-full bg-[#F5F5F5] rounded-xl shadow-2xl border border-gray-200 overflow-hidden'

    const headerStyles = isFullPage
        ? 'bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex items-center justify-between text-white'
        : 'bg-[#607D8B] p-4 flex items-center justify-between text-white shadow-md'

    const messagesContainerStyles = isFullPage
        ? 'flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50'
        : 'flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F5F5]'

    const inputContainerStyles = isFullPage
        ? 'p-4 bg-white border-t border-gray-200'
        : 'p-3 bg-white border-t border-gray-100'

    // ========================================================================
    // Render
    // ========================================================================
    return (
        <div className={`${containerStyles} ${className}`} style={{ fontFamily: '"Noto Sans JP", sans-serif' }}>
            {/* Header */}
            {showHeader && (
                <div className={headerStyles}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`${isFullPage ? 'w-12 h-12' : 'w-10 h-10'} rounded-full bg-white/20 backdrop-blur-sm overflow-hidden border border-white/30 flex items-center justify-center`}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <Bot className={isFullPage ? 'w-7 h-7' : 'w-6 h-6'} />
                                )}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-current rounded-full"></span>
                        </div>
                        <div>
                            <h3 className={`font-bold ${isFullPage ? 'text-lg' : 'text-base'} tracking-wide`}>
                                {chatOptions.personaName || '葵'}さん
                            </h3>
                            <p className="text-xs text-white/70 font-light">AI Legal Partner</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {showSaveButton && (
                            <button
                                onClick={handleSave}
                                disabled={messages.length <= 1 || isLoading}
                                className="p-2 hover:bg-white/10 rounded-full text-white/90 hover:text-white transition-all disabled:opacity-30"
                                title="会話を保存"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        )}
                        {showClearButton && (
                            <button
                                onClick={clearMessages}
                                disabled={messages.length <= 1 || isLoading}
                                className="p-2 hover:bg-white/10 rounded-full text-white/90 hover:text-white transition-all disabled:opacity-30"
                                title="会話をクリア"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full text-white/90 hover:text-white transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className={`${messagesContainerStyles} ${messagesClassName}`}>
                {messages.map((msg, index) => {
                    // Skip empty placeholder message while loading (last assistant message with empty content)
                    const isLastMessage = index === messages.length - 1
                    const isEmptyAssistant = msg.role === 'assistant' && !msg.content.trim()
                    if (isLoading && isLastMessage && isEmptyAssistant) {
                        return null
                    }

                    return (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            avatarUrl={avatarUrl}
                            isFullPage={isFullPage}
                        />
                    )
                })}
                {isLoading && (
                    <div className="flex justify-start items-end gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white flex-shrink-0 mb-1 flex items-center justify-center">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <Bot className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                考え中...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className={`${inputContainerStyles} ${inputClassName}`}>
                <div className="flex gap-2 items-end">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-all flex-shrink-0"
                        title="ファイルを添付"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.docx,.txt"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    />

                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="質問を入力... (Shift+Enterで改行)"
                        rows={1}
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all placeholder:text-gray-400 resize-none"
                        style={{ minHeight: '42px', maxHeight: '120px' }}
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className={`p-2.5 ${isFullPage ? 'bg-gray-800 hover:bg-gray-700' : 'bg-[#607D8B] hover:bg-[#546E7A]'} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0`}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

// ============================================================================
// Message Bubble Component
// ============================================================================

interface MessageBubbleProps {
    message: ChatMessage
    avatarUrl?: string
    isFullPage?: boolean
}

function MessageBubble({ message, avatarUrl, isFullPage = false }: MessageBubbleProps) {
    const isUser = message.role === 'user'

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isUser && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 bg-white flex-shrink-0 mb-1 flex items-center justify-center">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <Bot className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                )}

                <div className="flex flex-col">
                    <div
                        className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${isUser
                            ? `${isFullPage ? 'bg-gray-800' : 'bg-[#607D8B]'} text-white rounded-2xl rounded-tr-none`
                            : 'bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100'
                            }`}
                    >
                        {message.content || '...'}
                    </div>
                </div>
            </div>
        </div>
    )
}
