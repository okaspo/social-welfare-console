'use client'

import { useChat } from '@ai-sdk/react'
import { Send, Bot, User, RefreshCcw, ShieldCheck, FileText, Calendar, Gavel, Briefcase, AlertTriangle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function ChatPage() {
    const [debugLogs, setDebugLogs] = useState<string[]>([])
    const addLog = (msg: string) => setDebugLogs(prev => [new Date().toISOString().split('T')[1].split('.')[0] + ' ' + msg, ...prev].slice(0, 5))

    // Decouple input from useChat to ensure responsiveness and avoid "undefined" issues
    const { messages, append, isLoading, reload, error } = (useChat as any)({
        api: '/api/chat',
        initialMessages: [],
        onError: (err: any) => addLog(`Error: ${err.message}`),
        onFinish: () => addLog('Finish'),
        onResponse: (res: any) => addLog(`Response: ${res.status} ${res.statusText}`)
    })

    const [localInput, setLocalInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [mode, setMode] = useState<number | null>(null)

    const [configError, setConfigError] = useState<string[] | null>(null)

    useEffect(() => {
        // Check for missing environment variables on load
        import('@/app/actions/config').then(({ checkEnvironmentConfig }) => {
            checkEnvironmentConfig().then((result) => {
                if (!result.isConfigured) {
                    setConfigError(result.missing)
                }
            })
        })
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleLocalSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!localInput.trim() || isLoading) return

        const content = localInput
        setLocalInput('') // Clear input immediately
        addLog(`Sending: ${content.substring(0, 10)}...`)

        try {
            await append({ role: 'user', content })
            addLog('Append called')
        } catch (e: any) {
            addLog(`Append failed: ${e.message}`)
        }
    }

    const startMode = (modeId: number, initialMessage: string) => {
        setMode(modeId)
        setLocalInput(initialMessage)
        // Optionally auto-submit or let user verify
    }

    if (configError) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] bg-red-50 rounded-xl border border-red-100 p-8 text-center">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">システム設定エラー</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                    環境変数が正しく設定されていません。<br />
                    Vercelのダッシュボードで以下の環境変数を設定してください。
                </p>
                <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm text-left mb-6 w-full max-w-md">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">不足している環境変数:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {configError.map((v) => (
                            <li key={v} className="text-sm font-mono text-red-700 bg-red-50 px-2 py-1 rounded inline-block w-full">{v}</li>
                        ))}
                    </ul>
                </div>
                <p className="text-xs text-gray-500">
                    設定後、再デプロイまたは「Redeploy」を行うと反映されます。
                </p>
            </div>
        )
    }

    // ... (rendering code remains mostly same, but using localInput)

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-sm">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">S級AI事務局 葵さん</h1>
                            <p className="text-xs text-gray-500">Version 4.7 • Legal Compliance Mode</p>
                        </div>
                    </div>
                    {isLoading && <span className="text-xs text-indigo-600 animate-pulse font-medium">回答を生成中...</span>}
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-sm text-red-600 font-medium">エラーが発生しました: {error.message}</span>
                        </div>
                        <button
                            onClick={() => reload()}
                            className="text-xs text-red-700 underline hover:text-red-800"
                        >
                            再試行
                        </button>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                            {/* Speech Bubble */}
                            <div className="relative mb-6 animate-bounce">
                                <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-bl-none shadow-md text-sm font-medium">
                                    こんにちは。何かお手伝いしましょうか？
                                </div>
                                {/* Triangle arrow for bubble */}
                                <div className="absolute left-4 bottom-[-6px] w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-indigo-600 border-r-[6px] border-r-transparent"></div>
                            </div>

                            <ShieldCheck className="h-20 w-20 text-indigo-200 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">法務支援・文書作成アシスタント</h3>
                            <p className="text-sm text-gray-500 max-w-md">
                                理事会・評議員会の運営、議事録作成、入札・契約手続きなどを<br />
                                法務知識に基づきサポートします。
                            </p>
                        </div>
                    )}

                    {messages.map((m: any) => (
                        <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.role !== 'user' && (
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot className="h-4 w-4 text-indigo-600" />
                                </div>
                            )}
                            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                }`}>
                                {m.content}
                            </div>
                            {m.role === 'user' && (
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <form onSubmit={handleLocalSubmit} className="relative">
                        <textarea
                            value={localInput}
                            onChange={(e) => setLocalInput(e.target.value)}
                            placeholder="例：来月の理事会の議案書を作成してください..."
                            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none h-[52px] max-h-32"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleLocalSubmit()
                                }
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !localInput.trim()}
                            className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-gray-400">
                            AIは誤った情報を生成する可能性があります。重要な法的判断は専門家にご確認ください。
                        </p>
                        {/* Debug Logs Toggle */}
                        <details className="mt-2 text-left">
                            <summary className="text-[10px] text-gray-300 cursor-pointer hover:text-gray-500">Debug Logs</summary>
                            <div className="bg-gray-900 text-green-400 p-2 rounded text-[10px] font-mono mt-1 max-h-20 overflow-auto">
                                {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
                                {debugLogs.length === 0 && <span className="opacity-50">No logs yet</span>}
                            </div>
                        </details>
                    </div>
                </div>
            </div>

            {/* Sidebar / Mode Selector */}
            <div className="w-80 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Gavel className="h-4 w-4 text-gray-500" />
                        支援モード選択
                    </h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => startMode(1, "次回の理事会の議事録と議案書を作成したいです。（モード１）")}
                            className="w-full text-left p-3 rounded-lg text-xs font-medium border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                        >
                            <div className="flex items-center gap-2 mb-1 text-gray-700 group-hover:text-indigo-700">
                                <FileText className="h-4 w-4" />
                                議事録・議案書作成
                            </div>
                            <span className="text-gray-400 group-hover:text-indigo-400">通常開催の手続き</span>
                        </button>

                        <button
                            onClick={() => startMode(2, "会議の開催スケジュールを相談したいです。（モード２）")}
                            className="w-full text-left p-3 rounded-lg text-xs font-medium border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                        >
                            <div className="flex items-center gap-2 mb-1 text-gray-700 group-hover:text-indigo-700">
                                <Calendar className="h-4 w-4" />
                                スケジュール提案
                            </div>
                            <span className="text-gray-400 group-hover:text-indigo-400">法定期間の逆算</span>
                        </button>

                        <button
                            onClick={() => startMode(5, "入札または契約手続きについて相談したいです。（モード５）")}
                            className="w-full text-left p-3 rounded-lg text-xs font-medium border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                        >
                            <div className="flex items-center gap-2 mb-1 text-gray-700 group-hover:text-indigo-700">
                                <Briefcase className="h-4 w-4" />
                                入札・契約支援
                            </div>
                            <span className="text-gray-400 group-hover:text-indigo-400">適正な契約方法の判定</span>
                        </button>
                    </div>
                </div>

                <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-md">
                    <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Knowledge Base</h3>
                    <div className="space-y-2 text-xs opacity-90">
                        <div className="flex justify-between border-b border-indigo-800 pb-1">
                            <span>法人名</span>
                            <span className="font-mono">社会福祉法人〇〇会</span>
                        </div>
                        <div className="flex justify-between border-b border-indigo-800 pb-1">
                            <span>理事定数</span>
                            <span className="font-mono">6名</span>
                        </div>
                        <div className="flex justify-between border-b border-indigo-800 pb-1">
                            <span>監事定数</span>
                            <span className="font-mono">2名</span>
                        </div>
                        <div className="flex justify-between border-b border-indigo-800 pb-1">
                            <span>評議員定数</span>
                            <span className="font-mono">7名</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-2 text-[10px] text-indigo-300 border-t border-indigo-800">
                        ※最新の役員データが読み込まれています
                    </div>
                </div>
            </div>
        </div >
    )
}
