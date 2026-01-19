'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Paperclip, Loader2, Sparkles, Save, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAssistantAvatar } from '@/lib/hooks/use-assistant-avatar';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface FullPageChatProps {
    personaId?: string;
    personaName?: string;
    personaEmoji?: string;
}

export default function FullPageChat({
    personaId = 'aoi',
    personaName = '葵',
    personaEmoji = '💙'
}: FullPageChatProps) {
    // Use static welcome message ID to prevent hydration mismatch
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome-msg',
            role: 'assistant',
            content: `こんにちは！${personaName}です。今日はどのようなお手伝いをしましょうか?\n\n💡 例えば：\n• 「議事録を作成して」\n• 「役員名簿を見せて」\n• 「理事会の招集通知を作成」`
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Lazy initialization of Supabase client to prevent hydration issues
    const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
    const getSupabase = useCallback(() => {
        if (!supabaseRef.current) {
            supabaseRef.current = createClient();
        }
        return supabaseRef.current;
    }, []);

    // Temporarily use static avatar to debug JS execution issue
    // const { avatarUrl } = useAssistantAvatar(personaId);
    const avatarUrl = '/assets/avatars/aoi_face_icon.jpg';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Reset textarea height
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        try {
            const response = await fetch('/api/swc/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            });

            if (!response.ok) throw new Error('Chat API error');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            const assistantMsgId = Date.now().toString();
            setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });

                    // Debug: log raw chunk
                    console.log('[Chat] Chunk:', chunk);

                    // AI SDK streams text in format: 0:"text content"
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (!line.trim()) continue;

                        // Log each line for debugging
                        console.log('[Chat] Line:', line);

                        try {
                            const data = JSON.parse(line)

                            // Handle Custom NDJSON format
                            if (data.type === 'text-delta' && data.value) {
                                assistantContent += data.value
                            } else if (data.type === 'error' || data.type === 'server-error') {
                                console.error('[Chat] Stream Error:', data.value)
                                assistantContent += `\n\n[システムエラー: ${data.value}]`
                            }
                        } catch (e) {
                            // Fallback check for AI SDK format
                            if (line.startsWith('0:')) {
                                const content = line.substring(2)
                                try {
                                    const parsed = JSON.parse(content)
                                    assistantContent += parsed
                                } catch {
                                    assistantContent += content
                                }
                            }
                        }
                    }

                    setMessages(prev =>
                        prev.map(m =>
                            m.id === assistantMsgId
                                ? { ...m, content: assistantContent }
                                : m
                        )
                    );
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: '申し訳ありません。エラーが発生しました。もう一度お試しください。'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleSaveChat = async () => {
        if (messages.length <= 1) return;
        setIsSaving(true);

        try {
            // TODO: Implement chat saving
            await new Promise(resolve => setTimeout(resolve, 1000));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        {message.role === 'assistant' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm shadow-md">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={personaName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    personaEmoji
                                )}
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div
                            className={`
                                max-w-[80%] px-4 py-3 rounded-2xl
                                ${message.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                }
                            `}
                        >
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.content || (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>考え中...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm shadow-md">
                            {personaEmoji}
                        </div>
                        <div className="bg-gray-100 text-gray-600 px-4 py-3 rounded-2xl rounded-bl-sm">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 animate-pulse text-indigo-500" />
                                <span className="text-sm">{personaName}が考え中...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    {/* Save Button */}
                    <button
                        type="button"
                        onClick={handleSaveChat}
                        disabled={isSaving || messages.length <= 1}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        title="会話を保存"
                    >
                        {isSaving ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Save className="h-5 w-5" />
                        )}
                    </button>

                    {/* File Upload */}
                    <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="ファイル添付"
                    >
                        <Paperclip className="h-5 w-5" />
                    </button>

                    {/* Text Input */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={`${personaName}に話しかける...`}
                            rows={1}
                            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            style={{ maxHeight: '120px' }}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </form>

                {/* Tips */}
                <div className="mt-2 text-xs text-gray-400 text-center">
                    Shift+Enterで改行 • Enterで送信
                </div>
            </div>
        </div>
    );
}
