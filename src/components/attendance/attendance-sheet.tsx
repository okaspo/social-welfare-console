
'use client'

import { useState } from 'react'
import { MOCK_OFFICERS, Officer } from '@/lib/officers/data'
import { Check, X, Users, AlertTriangle } from 'lucide-react'

// Simple mock for "special interest" (Rigai Kankeinin)
// In a real app, this would be determined by the agenda items
const SPECIAL_INTEREST_IDS = ['o-1'] // e.g., The outcome affects Officer 1

export default function AttendanceSheet() {
    // Filter only directors for board meetings
    const directors = MOCK_OFFICERS.filter(o => o.role === 'director')

    // State: present officer IDs
    // Default: All directors are present
    const [presentIds, setPresentIds] = useState<Set<string>>(new Set(directors.map(d => d.id)))
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set(SPECIAL_INTEREST_IDS))

    const toggleAttendance = (id: string) => {
        const newSet = new Set(presentIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setPresentIds(newSet)
    }

    const toggleExclusion = (id: string) => {
        const newSet = new Set(excludedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setExcludedIds(newSet)
    }

    // Calculation
    // Social Welfare Act: Quorum is majority of directors excluding those with special interest
    const totalDirectors = directors.length
    const effectiveDirectors = directors.filter(d => !excludedIds.has(d.id))
    const quorumThreshold = Math.ceil(effectiveDirectors.length / 2) // Majority (> half)

    // Count present directors who are NOT excluded
    const presentEffectiveCount = effectiveDirectors.filter(d => presentIds.has(d.id)).length

    const isQuorumMet = presentEffectiveCount > effectiveDirectors.length / 2

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className={`p-6 rounded-xl border-2 transition-colors ${isQuorumMet ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            定足数確認（理事会）
                        </h2>
                        <p className="text-sm text-gray-600">
                            定款および社会福祉法第45条の14に基づき、決議に加わることができる理事の過半数の出席が必要です。
                        </p>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${isQuorumMet ? 'text-green-600' : 'text-red-600'}`}>
                            {isQuorumMet ? '成立' : '不成立'}
                        </div>
                        <div className="text-sm text-gray-500">
                            必要出席数: {Math.floor(effectiveDirectors.length / 2) + 1}名以上
                            (現在: {presentEffectiveCount}名)
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">氏名</th>
                            <th className="px-6 py-3 text-center">特別利害関係</th>
                            <th className="px-6 py-3 text-center">出欠</th>
                            <th className="px-6 py-3 text-center">有効出席</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {directors.map(director => {
                            const isExcluded = excludedIds.has(director.id)
                            const isPresent = presentIds.has(director.id)
                            const isEffective = isPresent && !isExcluded

                            return (
                                <tr key={director.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {director.name}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleExclusion(director.id)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${isExcluded
                                                    ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                }`}
                                        >
                                            {isExcluded ? '該当' : 'なし'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleAttendance(director.id)}
                                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isPresent
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                }`}
                                        >
                                            {isPresent ? '出席' : '欠席'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {isEffective ? (
                                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                                        ) : (
                                            <span className="block w-1.5 h-1.5 bg-gray-300 rounded-full mx-auto"></span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <p>
                        「特別利害関係」に該当する理事は、定足数の算定基礎（分母）および出席数（分子）から除外されます。
                        <br />（社会福祉法第45条の14第5項による準用）
                    </p>
                </div>
            </div>
        </div>
    )
}
