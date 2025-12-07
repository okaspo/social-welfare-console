'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { Officer, MOCK_OFFICERS, OfficerRole, getRoleLabel, getTermLimitYears } from '@/lib/officers/data'

interface OfficerListProps {
    initialOfficers: Officer[]
}

export default function OfficerList({ initialOfficers }: OfficerListProps) {
    const [officers, setOfficers] = useState<Officer[]>(initialOfficers)
    const [filter, setFilter] = useState<OfficerRole | 'all'>('all')

    const filteredOfficers = filter === 'all'
        ? officers
        : officers.filter(o => o.role === filter)

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
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors">
                    <Plus className="h-4 w-4" />
                    新規登録
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 font-medium">氏名</th>
                            <th className="px-6 py-3 font-medium">役職 / 任期規定</th>
                            <th className="px-6 py-3 font-medium">任期開始</th>
                            <th className="px-6 py-3 font-medium">任期満了</th>
                            <th className="px-6 py-3 font-medium">状態</th>
                            <th className="px-6 py-3 font-medium text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOfficers.map((officer) => (
                            <tr key={officer.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{officer.name}</div>
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
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
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
