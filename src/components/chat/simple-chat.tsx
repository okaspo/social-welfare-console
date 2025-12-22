'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface SimpleChatProps {
    personaName?: string;
    personaEmoji?: string;
}

export default function SimpleChat({
    personaName = '葵',
    personaEmoji = '💙'
}: SimpleChatProps) {
    const [inputValue, setInputValue] = useState('');
    const [localMessages, setLocalMessages] = useState<Array<{ id: string, role: string, content: string }>>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `こんにちは！${personaName}です。今日はどのようなお手伝いをしましょうか？`
        }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localMessages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: inputValue.trim()
        };

        setLocalMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
        setError(null);

        try {
            console.log('[SimpleChat] Sending request...');
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...localMessages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            });

            console.log('[SimpleChat] Response status:', response.status);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';
            const assistantMsgId = `assistant-${Date.now()}`;

            setLocalMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    console.log('[SimpleChat] Chunk:', chunk);

                    // Parse AI SDK streaming format (Data Stream Protocol)
                    // Format: 
                    // 0:"text content"
                    // d:{"key":"value"} (data)
                    // e:{"error":"..."} (error)
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (!line.trim()) continue;

                        // Handle text delta: 0:"text"
                        if (line.startsWith('0:')) {
                            const content = line.substring(2);
                            try {
                                // Content is JSON string encoded, e.g. "Hello"
                                const parsed = JSON.parse(content);
                                assistantContent += parsed;
                            } catch {
                                // Fallback
                                assistantContent += content;
                            }
                        }
                        // Handle formatting (sometimes it comes as raw JSON if toTextStreamResponse was used, but we are back to toDataStreamResponse)
                    }

                    setLocalMessages(prev =>
                        prev.map(m =>
                            m.id === assistantMsgId
                                ? { ...m, content: assistantContent }
                                : m
                        )
                    );
                }
            }

            console.log('[SimpleChat] Final content:', assistantContent);
        } catch (err: any) {
            console.error('[SimpleChat] Error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">
                    {personaEmoji}
                </div>
                <div>
                    <h1 className="font-bold text-gray-900">{personaName}</h1>
                    <p className="text-xs text-gray-500">オンライン</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {localMessages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === 'user'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                            <span className="text-gray-500">考え中...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex justify-center">
                        <div className="bg-red-100 text-red-700 rounded-lg px-4 py-2 text-sm">
                            エラー: {error}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-gray-200 p-4">
                <div className="flex items-end gap-2">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="メッセージを入力..."
                        className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
