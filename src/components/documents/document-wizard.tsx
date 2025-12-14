'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, FileText, ArrowRight, Check, AlertCircle } from 'lucide-react'
import { useChat } from '@ai-sdk/react'

// Types
interface DocumentTemplate {
    id: string
    name: string
    content: string
    category: string
}

interface Officer {
    id: string
    name: string
    role: string
}

const MODES = [
    { id: '1', name: '議案書の作成（通常開催）', description: '通常の理事会・評議員会' },
    { id: '2', name: '開催スケジュールの提案', description: '日程調整・招集通知の準備' },
    { id: '3', name: '招集手続きの省略による会議開催', description: '全員の同意がある場合' },
    { id: '4', name: '決議の省略（みなし決議）手続き', description: '書面決議を行う場合' },
    { id: '5', name: '入札・契約手続きの支援', description: '工事・物品購入等の契約' }
]

export default function DocumentWizard() {
    const router = useRouter()
    const supabase = createClient()

    // Steps: 1=Template/Mode, 2=Input, 3=Review/Generate
    const [step, setStep] = useState(1)

    // Data State
    const [templates, setTemplates] = useState<DocumentTemplate[]>([])
    const [officers, setOfficers] = useState<Officer[]>([])
    const [loading, setLoading] = useState(true)

    // Selection State
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
    const [selectedMode, setSelectedMode] = useState<string>('1')

    // Input Form State
    const [meetingType, setMeetingType] = useState('理事会')
    const [date, setDate] = useState('')
    const [place, setPlace] = useState('')
    const [attendees, setAttendees] = useState<string[]>([])
    const [agendaItems, setAgendaItems] = useState([''])

    // AI Generation
    const { messages, input, handleInputChange, handleSubmit, setInput, isLoading: isAiLoading, append } = (useChat as any)({
        api: '/api/chat/generate-doc', // New specialized endpoint
        initialMessages: []
    })

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            // Fetch Templates
            const { data: tmplData } = await supabase
                .from('document_templates')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (tmplData) setTemplates(tmplData)

            // Auto-select first template if available (e.g. V4.7)
            if (tmplData && tmplData.length > 0) setSelectedTemplateId(tmplData[0].id)

            // Fetch Officers for attendee selection
            const { data: offData } = await supabase
                .from('officers')
                .select('id, name, role')

            if (offData) {
                setOfficers(offData)
                // Pre-select all by default? Or just let user pick.
                // setAttendees(offData.map(o => o.name)) 
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    const handleNext = () => setStep(prev => prev + 1)
    const handleBack = () => setStep(prev => prev - 1)

    const handleGenerate = async () => {
        if (!selectedTemplateId) return

        const template = templates.find(t => t.id === selectedTemplateId)
        if (!template) return

        // Construct the system prompt + user input context
        const context = `
【選択されたモード】: モード${selectedMode}
【会議種別】: ${meetingType}
【開催日時】: ${date}
【開催場所】: ${place}
【出席者】: ${attendees.join(', ')}
【議題】: 
${agendaItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

---
以下はベースとなるプロンプトです。この指示に従い、上記の入力情報に基づいて文書を作成してください。

${template.content}
`
        // Trigger AI Generation
        await append({
            role: 'user',
            content: context
        })
    }

    // Toggle attendee selection
    const toggleAttendee = (name: string) => {
        setAttendees(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        )
    }

    if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></div>

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Steps Indicator */}
            <div className="flex items-center justify-center space-x-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`flex items-center ${i < 3 ? 'w-full' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= i ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                            {i}
                        </div>
                        {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > i ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            {/* Step 1: Template & Mode */}
            {step === 1 && (
                <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900">1. 作成モードの選択</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">使用するテンプレート（プロンプト）</label>
                        <select
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {MODES.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`p-4 text-left rounded-lg border-2 transition-all ${selectedMode === mode.id
                                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                    : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${selectedMode === mode.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        モード{mode.id}
                                    </span>
                                    {selectedMode === mode.id && <Check className="h-5 w-5 text-indigo-600" />}
                                </div>
                                <h3 className={`font-bold mt-2 ${selectedMode === mode.id ? 'text-indigo-900' : 'text-gray-900'}`}>{mode.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{mode.description}</p>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={handleNext} className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                            次へ <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Input Details */}
            {step === 2 && (
                <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={handleBack} className="text-gray-400 hover:text-gray-600">戻る</button>
                        <h2 className="text-xl font-bold text-gray-900">2. 基本情報の入力</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">会議種別</label>
                            <select
                                value={meetingType}
                                onChange={(e) => setMeetingType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            >
                                <option value="理事会">理事会</option>
                                <option value="評議員会">評議員会</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">開催日時</label>
                            <input
                                type="datetime-local"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">開催場所</label>
                            <input
                                type="text"
                                value={place}
                                onChange={(e) => setPlace(e.target.value)}
                                placeholder="例：法人本部 第一会議室"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">出席者 <span className="text-xs text-gray-500">（クリックで選択）</span></label>
                        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            {officers.map(officer => (
                                <button
                                    key={officer.id}
                                    onClick={() => toggleAttendee(officer.name)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${attendees.includes(officer.name)
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {officer.name} <span className="text-xs opacity-70">({officer.role})</span>
                                </button>
                            ))}
                            {officers.length === 0 && <span className="text-gray-400 text-sm">役員データがありません</span>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">議題</label>
                        {agendaItems.map((item, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <span className="py-2 text-gray-400 w-6 text-center">{idx + 1}.</span>
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => {
                                        const newItems = [...agendaItems]
                                        newItems[idx] = e.target.value
                                        setAgendaItems(newItems)
                                    }}
                                    placeholder="議題を入力..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                                {agendaItems.length > 1 && (
                                    <button
                                        onClick={() => setAgendaItems(agendaItems.filter((_, i) => i !== idx))}
                                        className="text-gray-400 hover:text-red-500 px-2"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={() => setAgendaItems([...agendaItems, ''])}
                            className="mt-2 text-sm text-indigo-600 hover:underline flex items-center gap-1"
                        >
                            + 議題を追加
                        </button>
                    </div>

                    <div className="flex justify-end pt-4 bg-gray-50 -m-6 p-6 mt-6 rounded-b-xl border-t border-gray-100">
                        <button
                            onClick={() => {
                                handleGenerate()
                                handleNext()
                            }}
                            disabled={!date || !place || attendees.length === 0}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-bold"
                        >
                            <FileText className="h-5 w-5" />
                            文書を生成する
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Result & Preview */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">← 再調整する</button>
                        <h2 className="text-xl font-bold text-gray-900">生成結果</h2>
                    </div>

                    {isAiLoading ? (
                        <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto text-indigo-600 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">AIが文書を作成中...</h3>
                            <p className="text-gray-500">法令要件のチェック、フォーマットの適用を行っています。<br />これには数十秒かかる場合があります。</p>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            {/* Display the last message from AI */}
                            <div className="prose max-w-none whitespace-pre-wrap font-mono text-sm bg-gray-50 p-6 rounded-lg border border-gray-200">
                                {messages.filter((m: any) => m.role === 'assistant').slice(-1)[0]?.content || '生成エラー: コンテンツがありません'}
                            </div>

                            <div className="mt-6 flex justify-end gap-4">
                                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">コピーする</button>
                                <button
                                    onClick={async () => {
                                        if (!messages.length) return
                                        const lastMsg = messages.filter((m: any) => m.role === 'assistant').slice(-1)[0]
                                        if (!lastMsg) return

                                        try {
                                            const { data: { user } } = await supabase.auth.getUser()
                                            if (!user) throw new Error('Auth error')

                                            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
                                            if (!profile?.organization_id) throw new Error('Org error')

                                            const { error } = await supabase.from('private_documents').insert({
                                                title: `${meetingType}議事録 (${date})`,
                                                content: lastMsg.content,
                                                organization_id: profile.organization_id,
                                                created_by: user.id,
                                                metadata: {
                                                    meeting_type: meetingType,
                                                    date,
                                                    place,
                                                    attendees
                                                }
                                            })

                                            if (error) throw error

                                            alert('保存しました')
                                            router.push('/dashboard/documents')
                                        } catch (e: any) {
                                            console.error(e)
                                            alert('保存に失敗しました: ' + e.message)
                                        }
                                    }}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm font-bold"
                                >
                                    保存する
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
