'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle, Download, Eye, EyeOff, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { Officer, MOCK_OFFICERS, OfficerRole, getRoleLabel, getTermLimitYears } from '@/lib/officers/data'
import NewOfficerDialog from './new-officer-dialog'


interface OfficerListProps {
    initialOfficers: Officer[]
    readOnly?: boolean
}

function GovernanceAlert({ officers }: { officers: Officer[] }) {
    const allTags = officers.flatMap(o => o.expertise_tags || [])
    const hasFinance = allTags.some(t => t.includes('財務') || t.includes('会計') || t.includes('Finance'))
    const hasLegal = allTags.some(t => t.includes('法務') || t.includes('弁護士') || t.includes('Legal'))
    const hasWelfare = allTags.some(t => t.includes('福祉') || t.includes('介護') || t.includes('Welfare'))

    if (hasFinance && hasLegal && hasWelfare) return null

    const missing = []
    if (!hasFinance) missing.push('財務')
    if (!hasLegal) missing.push('法務')
    if (!hasWelfare) missing.push('社会福祉')

    return (
        <div className="mx-4 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
                <h4 className="text-sm font-bold text-yellow-800">ガバナンス・バランス アラート</h4>
                <p className="text-sm text-yellow-700 mt-1">
                    現在の役員構成には、以下の専門性が不足している可能性があります:
                    <span className="font-bold ml-1">{missing.join('・')}</span>
                </p>
            </div>
        </div>
    )
}

import { deleteOfficer } from '@/app/swc/dashboard/officers/[id]/actions'
import { useRouter } from 'next/navigation'

export default function OfficerList({ initialOfficers, readOnly = false }: OfficerListProps) {
    const router = useRouter()
    const [officers, setOfficers] = useState<Officer[]>(initialOfficers)
    const [filter, setFilter] = useState<OfficerRole | 'all'>('all')
    const [privacyMask, setPrivacyMask] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleDelete = async (id: string) => {
        if (!confirm('この役員を削除しますか？\nこの操作は取り消せません。')) return

        setIsLoading(true)
        try {
            const res = await deleteOfficer(id)
            if (res.error) {
                alert(res.error)
            } else {
                router.refresh()
                // Optimistic update
                setOfficers(prev => prev.filter(o => o.id !== id))
            }
        } catch (e) {
            alert('削除中にエラーが発生しました')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredOfficers = filter === 'all'
        ? officers
        : officers.filter(o => o.role === filter)

    // Privacy mask helper
    const maskName = (name: string) => {
        if (!privacyMask) return name
        const parts = name.split(' ')
        if (parts.length >= 2) {
            return parts[0] + ' ' + '●'.repeat(parts[1].length)
        }
        return name.charAt(0) + '●'.repeat(name.length - 1)
    }

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['氏名', '役職', '任期開始', '任期満了', '状態']
        const rows = filteredOfficers.map(o => [
            privacyMask ? maskName(o.name) : o.name,
            getRoleLabel(o.role),
            o.termStartDate,
            o.termEndDate,
            new Date(o.termEndDate) < new Date() ? '任期満了' : '有効'
        ])

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `役員名簿_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    // Export to PDF (printable format)
    const exportToPDF = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        printWindow.document.write(`
            <html>
            <head>
                <title>役員名簿</title>
                <style>
                    body { font-family: 'Hiragino Sans', 'Meiryo', sans-serif; padding: 40px; }
                    h1 { text-align: center; margin-bottom: 30px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #333; padding: 12px; text-align: left; }
                    th { background: #f5f5f5; }
                    .expired { color: red; }
                    .footer { margin-top: 40px; text-align: right; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <h1>役員名簿</h1>
                <table>
                    <thead>
                        <tr>
                            <th>氏名</th>
                            <th>役職</th>
                            <th>任期開始</th>
                            <th>任期満了</th>
                            <th>状態</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredOfficers.map(o => {
            const isExpired = new Date(o.termEndDate) < new Date()
            return `<tr>
                                <td>${privacyMask ? maskName(o.name) : o.name}</td>
                                <td>${getRoleLabel(o.role)}</td>
                                <td>${o.termStartDate}</td>
                                <td>${o.termEndDate}</td>
                                <td class="${isExpired ? 'expired' : ''}">${isExpired ? '任期満了' : '有効'}</td>
                            </tr>`
        }).join('')}
                    </tbody>
                </table>
                <div class="footer">出力日: ${new Date().toLocaleDateString('ja-JP')}</div>
            </body>
            </html>
        `)
        printWindow.document.close()
        printWindow.print()
    }

    // Status Badge Helper
    const getStatusBadge = (officer: Officer) => {
        const today = new Date()
        const endDate = new Date(officer.termEndDate)
        const isExpired = endDate < today

        if (isExpired) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <AlertCircle className="h-3 w-3" />
                    任期満了
                </span>
            )
        }

        // Check if expiring within 3 months (approx 90 days)
        const threeMonthsFromNow = new Date()
        threeMonthsFromNow.setDate(today.getDate() + 90)

        if (endDate < threeMonthsFromNow) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <AlertCircle className="h-3 w-3" />
                    満了間近
                </span>
            )
        }

        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3" />
                有効
            </span>
        )
    }

    // Role Badge Helper
    const getRoleBadge = (role: OfficerRole) => {
        const label = getRoleLabel(role)
        const termLimit = getTermLimitYears(role)
        return (
            <div>
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-xs text-gray-400">任期: {termLimit}年</div>
            </div>
        )
    }

    return (
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
            {/* Header / Filter */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-2">
                    {/* ... filters ... */}
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        すべて
                    </button>
                    {(['director', 'auditor', 'councilor', 'selection_committee'] as const).map((role) => (
                        <button
                            key={role}
                            onClick={() => setFilter(role)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === role
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {getRoleLabel(role)}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {/* Privacy Toggle */}
                    <button
                        onClick={() => setPrivacyMask(!privacyMask)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${privacyMask ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                        title={privacyMask ? '個人情報を表示' : '個人情報をマスク'}
                    >
                        {privacyMask ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {privacyMask ? 'マスク中' : 'マスク'}
                    </button>

                    {/* Export Buttons */}
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                        title="Excel用CSV出力"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        CSV
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                        title="印刷用PDF出力"
                    >
                        <FileText className="h-4 w-4" />
                        PDF
                    </button>

                    {!readOnly && (
                        <NewOfficerDialog />
                    )}
                </div>
            </div>

            {/* Governance Balance Alert */}
            <GovernanceAlert officers={officers} />

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    {/* ... thead ... */}
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 font-medium">氏名</th>
                            <th className="px-6 py-3 font-medium">役職 / 任期規定</th>
                            <th className="px-6 py-3 font-medium">任期開始</th>
                            <th className="px-6 py-3 font-medium">任期満了</th>
                            <th className="px-6 py-3 font-medium">状態</th>
                            {!readOnly && <th className="px-6 py-3 font-medium text-right">操作</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOfficers.map((officer) => (
                            <tr key={officer.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                        <a href={`/swc/dashboard/officers/${officer.id}`} className="hover:underline">
                                            {maskName(officer.name)}
                                        </a>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getRoleBadge(officer.role)}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {officer.termStartDate}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {officer.termEndDate}
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(officer)}
                                </td>
                                {!readOnly && (
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <a
                                                href={`/swc/dashboard/officers/${officer.id}`}
                                                className="p-2 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-all"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(officer.id)}
                                                disabled={isLoading}
                                                className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                                                title="削除"
                                            >
                                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>


                {filteredOfficers.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        該当する役員は見つかりませんでした。
                    </div>
                )}
            </div>
        </div>
    )
}
