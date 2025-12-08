'use client'

import { useState } from 'react'
import { Plus, Trash2, FileText, Loader2, Download, FileDown, Briefcase } from 'lucide-react'
import { generateMinutes, MinutesData } from '@/lib/generator/minutes-template'
import { exportMinutesToDocx, exportProposalToDocx } from '@/lib/generator/docx-exporter'
import { PricingPlan, canAccess } from '@/lib/auth/access-control'

// Mock Plan for Demo - Change to 'FREE' to test restrictions
const CURRENT_PLAN: PricingPlan = 'STANDARD'

interface MinutesFormProps {
    initialCorporationName?: string
}

export default function MinutesForm({ initialCorporationName = '〇〇会' }: MinutesFormProps) {
    const [loading, setLoading] = useState(false)
    const [generatedDoc, setGeneratedDoc] = useState('')

    // New Agenda Input State
    const [newAgenda, setNewAgenda] = useState({ title: '', content: '' })

    const [formData, setFormData] = useState<MinutesData>({
        corporationName: initialCorporationName,
        date: '',
        startTime: '14:00',
        endTime: '15:00',
        venue: '当法人 ホール',
        totalDirectors: 6,
        attendedDirectors: 6,
        totalAuditors: 2,
        attendedAuditors: 2,
        chairperson: '福祉 太郎',
        agendas: [],
        signatories: ['理事 花子', '監事 次郎']
    })

    const canExport = canAccess(CURRENT_PLAN, 'word_export')

    const updateAgenda = (index: number, field: keyof typeof formData.agendas[0], value: string) => {
        const newAgendas = [...formData.agendas]
        // @ts-ignore
        newAgendas[index][field] = value
        setFormData({ ...formData, agendas: newAgendas })
    }

    const handleStockAgenda = () => {
        if (!newAgenda.title) return
        setFormData({
            ...formData,
            agendas: [...formData.agendas, { ...newAgenda, result: 'approved' }]
        })
        setNewAgenda({ title: '', content: '' })
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
                    <h2 className="text-lg font-semibold text-gray-900">議事録・議案書の作成</h2>
                    <p className="text-sm text-gray-500">議案を入力してストックし、議案書や議事録を作成します。</p>
                </div>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">法人名</label>
                            <div className="w-full px-3 py-2 border border-gray-100 bg-gray-50 rounded-md text-sm font-medium text-gray-900">
                                {formData.corporationName}
                            </div>
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

                    <div className="border-t border-gray-100 pt-2"></div>

                    {/* NEW: Use Case - Stock Workflow */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
                        <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            議案の入力・ストック
                        </h3>
                        <div className="space-y-3 bg-white p-3 rounded border border-blue-100">
                            <div>
                                <input
                                    type="text"
                                    placeholder="件名（例：〇〇規程改定の件）"
                                    value={newAgenda.title}
                                    onChange={(e) => setNewAgenda({ ...newAgenda, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                />
                            </div>
                            <div>
                                <textarea
                                    placeholder="内容・提案理由（例：法令改正に伴い...）"
                                    value={newAgenda.content}
                                    onChange={(e) => setNewAgenda({ ...newAgenda, content: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                />
                            </div>
                            <button
                                onClick={handleStockAgenda}
                                disabled={!newAgenda.title}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                議案リストに追加（ストック）
                            </button>
                        </div>
                    </div>

                    {/* Stocked Agendas List */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                登録済み議案リスト ({formData.agendas.length}件)
                            </label>
                        </div>

                        {formData.agendas.length === 0 && (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-md border border-dashed border-gray-200 text-sm">
                                議案はまだありません。<br />上のフォームから追加してください。
                            </div>
                        )}

                        <div className="space-y-4">
                            {formData.agendas.map((agenda, index) => (
                                <div key={index} className="p-3 border border-gray-200 rounded-md space-y-2 relative group bg-white shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            第 {index + 1} 号議案
                                        </span>
                                        <button onClick={() => removeAgenda(index)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Editable Fields in List */}
                                    <input
                                        type="text"
                                        value={agenda.title}
                                        onChange={(e) => updateAgenda(index, 'title', e.target.value)}
                                        className="w-full px-2 py-1 border-b border-transparent hover:border-gray-200 focus:border-blue-500 text-sm font-bold text-gray-800 transition-colors"
                                    />
                                    <textarea
                                        value={agenda.content}
                                        onChange={(e) => updateAgenda(index, 'content', e.target.value)}
                                        className="w-full px-2 py-1 border-b border-transparent hover:border-gray-200 focus:border-blue-500 text-sm text-gray-600 min-h-[40px] resize-none transition-colors"
                                    />

                                    {/* Result is relevant for Minutes, but maybe not Proposal */}
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                        <span className="text-xs text-gray-400">結果:</span>
                                        <select
                                            value={agenda.result}
                                            // @ts-ignore
                                            onChange={(e) => updateAgenda(index, 'result', e.target.value)}
                                            className="text-xs border-none bg-transparent focus:ring-0 text-gray-600 font-medium cursor-pointer"
                                        >
                                            <option value="approved">承認可決</option>
                                            <option value="acknowledged">報告・了承</option>
                                            <option value="pending">継続審議</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4"></div>

                    {/* Attendance & Signatories (Collapsible or Bottom) */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                        <h3 className="col-span-2 text-sm font-medium text-gray-900">その他情報（議事録用）</h3>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">理事総数</label>
                            <input type="number" value={formData.totalDirectors} onChange={(e) => setFormData({ ...formData, totalDirectors: parseInt(e.target.value) })} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">議長名</label>
                            <input type="text" value={formData.chairperson} onChange={(e) => setFormData({ ...formData, chairperson: e.target.value })} className="w-full px-2 py-1 border border-gray-200 rounded text-sm" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">署名人</label>
                            <div className="flex gap-2">
                                <input type="text" value={formData.signatories[0]} onChange={(e) => updateSignatory(0, e.target.value)} className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm" />
                                <input type="text" value={formData.signatories[1]} onChange={(e) => updateSignatory(1, e.target.value)} className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: Preview & Actions */}
            <div className="flex flex-col h-full">
                <div className="bg-gray-50 rounded-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
                    <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">プレビュー</span>
                        </div>
                        {loading && <span className="text-xs text-gray-400 animate-pulse">生成中...</span>}
                    </div>
                    <div className="flex-1 p-8 overflow-y-auto font-serif leading-relaxed text-gray-800 bg-white">
                        {generatedDoc ? (
                            <pre className="whitespace-pre-wrap font-serif text-sm md:text-base">{generatedDoc}</pre>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Briefcase className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-sm text-center">議案をストックして、<br />議案書または議事録を作成してください</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 flex flex-col items-end gap-3">
                    {!canExport && (
                        <span className="text-xs text-red-500 font-medium">※Word出力はスタンダードプラン以上で利用可能です</span>
                    )}

                    {/* Action Bar */}
                    <div className="flex justify-end gap-2 w-full">
                        {/* Proposal Document Action */}
                        <button
                            onClick={() => exportProposalToDocx(formData)}
                            disabled={!canExport || formData.agendas.length === 0}
                            className="flex items-center gap-2 px-4 py-3 bg-white text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-50"
                        >
                            <FileDown className="h-4 w-4" />
                            議案書を作成
                        </button>

                        {/* Minutes Actions */}
                        {generatedDoc && (
                            <button
                                onClick={() => exportMinutesToDocx(formData)}
                                disabled={!canExport}
                                className="flex items-center gap-2 px-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                            >
                                <Download className="h-4 w-4" />
                                議事録Word
                            </button>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-md"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                            {generatedDoc ? '議事録再生成' : '議事録プレビュー'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
