'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, FileText, Loader2, Download, AlertTriangle, Mail } from 'lucide-react'
import { generateNotice, MeetingData } from '@/lib/generator/notice-template'
import { exportNoticeToDocx } from '@/lib/generator/docx-exporter'
import { PlanGate } from '@/components/common/plan-gate'
import { useUser } from '@/lib/hooks/use-user'

export default function MeetingForm() {
    const [loading, setLoading] = useState(false)
    const [sendingEmail, setSendingEmail] = useState(false)
    const [generatedDoc, setGeneratedDoc] = useState('')
    const { profile, subscription } = useUser()

    const [formData, setFormData] = useState<MeetingData>({
        type: 'board_of_directors',
        date: '',
        time: '14:00',
        venue: '当法人 本部会議室',
        agendas: [{ title: '' }],
        corporationName: '',
        representativeName: ''
    })


    // Load organization data from profile
    useEffect(() => {
        if (profile?.organization_name) {
            setFormData(prev => ({
                ...prev,
                corporationName: profile.organization_name || '',
                representativeName: profile.full_name || ''
            }))
        }
    }, [profile])

    const handleSendEmail = async () => {
        if (!generatedDoc) return
        setSendingEmail(true)
        try {
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: `${formData.corporationName} ${formData.type === 'board_of_directors' ? '理事会' : '評議員会'} 開催のお知らせ`,
                    content: generatedDoc
                })
            })
            if (response.ok) {
                alert('招集通知メールを送信しました')
            } else {
                alert('メール送信に失敗しました')
            }
        } catch (error) {
            console.error(error)
            alert('エラーが発生しました')
        } finally {
            setSendingEmail(false)
        }
    }



    const updateAgenda = (index: number, value: string) => {
        const newAgendas = [...formData.agendas]
        newAgendas[index].title = value
        setFormData({ ...formData, agendas: newAgendas })
    }

    const addAgenda = () => {
        setFormData({
            ...formData,
            agendas: [...formData.agendas, { title: '' }]
        })
    }

    const removeAgenda = (index: number) => {
        const newAgendas = formData.agendas.filter((_, i) => i !== index)
        setFormData({ ...formData, agendas: newAgendas })
    }

    const handleGenerate = () => {
        setLoading(true)
        // Simulate API/Processing delay
        setTimeout(() => {
            const doc = generateNotice(formData)
            setGeneratedDoc(doc)
            setLoading(false)
        }, 800)
    }

    // Compliance Check: Social Welfare Act Article 45-17 (1 week notice)
    const isShortNotice = () => {
        if (!formData.date) return false
        const meetingDate = new Date(formData.date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const diffTime = meetingDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Warn if less than 7 days but in the future (0 to 6 days)
        return diffDays < 7 && diffDays >= 0
    }

    return (
        <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-100px)]">
            {/* LEFT: Input Form */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">会議情報の入力</h2>
                    <p className="text-sm text-gray-500">必要な情報を入力すると、AIが招集通知を自動生成します。</p>
                </div>

                <div className="space-y-6">

                    {/* Compliance Alert */}
                    {isShortNotice() && (
                        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
                            <div>
                                <p className="font-bold mb-1">社会福祉法 第45条の17（招集期間の遵守）</p>
                                <p>
                                    理事会の招集通知は、原則として会日の<span className="font-bold underline">1週間前</span>までに発しなければなりません。
                                    現在設定されている日付は1週間を切っています。定款に短縮の規定がない場合はご注意ください。
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Meeting Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">会議の種類</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setFormData({ ...formData, type: 'board_of_directors' })}
                                className={`flex-1 py-2 px-4 rounded-md text-sm border transition-colors ${formData.type === 'board_of_directors'
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                理事会
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, type: 'board_of_councilors' })}
                                className={`flex-1 py-2 px-4 rounded-md text-sm border transition-colors ${formData.type === 'board_of_councilors'
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                評議員会
                            </button>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">開催日</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">開始時刻</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">開催場所</label>
                        <input
                            type="text"
                            value={formData.venue}
                            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                    </div>

                    <div className="border-t border-gray-100 pt-4"></div>

                    {/* Agendas */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">議題（目的事項）</label>
                            <button onClick={addAgenda} className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900">
                                <Plus className="h-3 w-3" /> 追加
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.agendas.map((agenda, index) => (
                                <div key={index} className="flex gap-2">
                                    <span className="text-sm py-2 text-gray-400 w-6">{(index + 1).toString()}.</span>
                                    <input
                                        type="text"
                                        placeholder={`第${index + 1}号議案`}
                                        value={agenda.title}
                                        onChange={(e) => updateAgenda(index, e.target.value)}
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    />
                                    {formData.agendas.length > 1 && (
                                        <button onClick={() => removeAgenda(index)} className="p-2 text-gray-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: Preview */}
            <div className="flex flex-col h-full">
                <div className="bg-gray-50 rounded-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">

                    {/* Preview Header */}
                    <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">プレビュー: 招集通知書</span>
                        </div>
                        {loading && <span className="text-xs text-gray-400 animate-pulse">生成中...</span>}
                    </div>

                    {/* Preview Content */}
                    <div className="flex-1 p-8 overflow-y-auto font-serif leading-relaxed text-gray-800 bg-white">
                        {generatedDoc ? (
                            <pre className="whitespace-pre-wrap font-serif text-sm md:text-base">
                                {generatedDoc}
                            </pre>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <FileText className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-sm">左側のフォームに入力し、<br />「書類を生成」ボタンを押してください</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button Area */}
                <div className="mt-4 flex justify-end gap-3">
                    {generatedDoc && (
                        <button
                            onClick={() => exportNoticeToDocx(formData)}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Download className="h-4 w-4" />
                            Wordでダウンロード
                        </button>
                    )}

                    <button
                        onClick={handleSendEmail}
                        disabled={!generatedDoc || sendingEmail}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        メールで送信
                    </button>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        {generatedDoc ? '再生成する' : '書類を生成する'}
                    </button>
                </div>
            </div>
        </div>
    )
}
