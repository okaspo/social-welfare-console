'use client'

import { useState } from 'react'
import { Plus, Trash2, FileText, Loader2, Download } from 'lucide-react'
import { generateMinutes, MinutesData } from '@/lib/generator/minutes-template'
import { exportMinutesToDocx } from '@/lib/generator/docx-exporter'

export default function MinutesForm() {
    const [loading, setLoading] = useState(false)
    const [generatedDoc, setGeneratedDoc] = useState('')

    const [formData, setFormData] = useState<MinutesData>({
        corporationName: '〇〇会',
        date: '',
        startTime: '14:00',
        endTime: '15:00',
        venue: '当法人 ホール',
        totalDirectors: 6,
        attendedDirectors: 6,
        totalAuditors: 2,
        attendedAuditors: 2,
        chairperson: '福祉 太郎',
        agendas: [{ title: '平成〇〇年度 事業報告承認の件', content: '事務局より配付資料に基づき説明があり、質疑応答の結果、全員異議なく承認された。', result: 'approved' }],
        signatories: ['理事 花子', '監事 次郎']
    })

    const updateAgenda = (index: number, field: keyof typeof formData.agendas[0], value: string) => {
        const newAgendas = [...formData.agendas]
        // @ts-ignore
        newAgendas[index][field] = value
        setFormData({ ...formData, agendas: newAgendas })
    }

    const addAgenda = () => {
        setFormData({
            ...formData,
            agendas: [...formData.agendas, { title: '', content: '', result: 'approved' }]
        })
    }

    const removeAgenda = (index: number) => {
        const newAgendas = formData.agendas.filter((_, i) => i !== index)
        setFormData({ ...formData, agendas: newAgendas })
    }

    const updateSignatory = (index: number, value: string) => {
        const newSignatories = [...formData.signatories]
        newSignatories[index] = value
        setFormData({ ...formData, signatories: newSignatories })
    }

    const handleGenerate = () => {
        setLoading(true)
        setTimeout(() => {
            const doc = generateMinutes(formData)
            setGeneratedDoc(doc)
            setLoading(false)
        }, 800)
    }

    return (
        <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-100px)]">
            {/* LEFT: Input Form */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">議事録情報の入力</h2>
                    <p className="text-sm text-gray-500">会議の結果を入力して、正式な議事録を作成します。</p>
                </div>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">法人名（社会福祉法人を除く）</label>
                            <input
                                type="text"
                                value={formData.corporationName}
                                onChange={(e) => setFormData({ ...formData, corporationName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">開催日</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">開始</label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">終了</label>
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attendance */}
                    <div className="bg-gray-50 p-4 rounded-md space-y-4">
                        <h3 className="text-sm font-medium text-gray-900">出席状況</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">理事総数</label>
                                <input
                                    type="number"
                                    value={formData.totalDirectors}
                                    onChange={(e) => setFormData({ ...formData, totalDirectors: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">出席理事数</label>
                                <input
                                    type="number"
                                    value={formData.attendedDirectors}
                                    onChange={(e) => setFormData({ ...formData, attendedDirectors: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">監事総数</label>
                                <input
                                    type="number"
                                    value={formData.totalAuditors}
                                    onChange={(e) => setFormData({ ...formData, totalAuditors: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">出席監事数</label>
                                <input
                                    type="number"
                                    value={formData.attendedAuditors}
                                    onChange={(e) => setFormData({ ...formData, attendedAuditors: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Key Persons */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">議長名</label>
                        <input
                            type="text"
                            value={formData.chairperson}
                            onChange={(e) => setFormData({ ...formData, chairperson: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                    </div>

                    {/* Signatories */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">議事録署名人</label>
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="署名人1"
                                value={formData.signatories[0]}
                                onChange={(e) => updateSignatory(0, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                            <input
                                type="text"
                                placeholder="署名人2"
                                value={formData.signatories[1]}
                                onChange={(e) => updateSignatory(1, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4"></div>

                    {/* Agendas */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">審議事項</label>
                            <button onClick={addAgenda} className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900">
                                <Plus className="h-3 w-3" /> 追加
                            </button>
                        </div>
                        <div className="space-y-4">
                            {formData.agendas.map((agenda, index) => (
                                <div key={index} className="p-3 border border-gray-100 rounded-md space-y-2 relative group">
                                    <span className="text-xs font-semibold text-gray-400">第 {index + 1} 号議案</span>
                                    <button onClick={() => removeAgenda(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-4 w-4" />
                                    </button>

                                    <input
                                        type="text"
                                        placeholder="件名（例：〇〇承認の件）"
                                        value={agenda.title}
                                        onChange={(e) => updateAgenda(index, 'title', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    />
                                    <textarea
                                        placeholder="審議内容（例：〇〇について説明があり...）"
                                        value={agenda.content}
                                        onChange={(e) => updateAgenda(index, 'content', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 min-h-[60px]"
                                    />
                                    <select
                                        value={agenda.result}
                                        // @ts-ignore
                                        onChange={(e) => updateAgenda(index, 'result', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                                    >
                                        <option value="approved">承認可決</option>
                                        <option value="acknowledged">報告・了承</option>
                                        <option value="pending">継続審議</option>
                                    </select>
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
                            <span className="text-sm font-medium text-gray-700">プレビュー: 理事会議事録</span>
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
                                <p className="text-sm">左側のフォームに入力し、<br />「議事録を生成」ボタンを押してください</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button Area */}
                <div className="mt-4 flex justify-end gap-3">
                    {generatedDoc && (
                        <button
                            onClick={() => exportMinutesToDocx(formData)}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Download className="h-4 w-4" />
                            Wordでダウンロード
                        </button>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        {generatedDoc ? '再生成する' : '議事録を生成する'}
                    </button>
                </div>
            </div>
        </div>
    )
}
