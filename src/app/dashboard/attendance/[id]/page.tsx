'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, X, UserCog, User } from 'lucide-react'
import { MOCK_UPCOMING_MEETINGS, generateInitialAttendance, AttendanceRecord } from '@/lib/attendance/data'
import { MOCK_OFFICERS, OfficerRole } from '@/lib/officers/data'
import clsx from 'clsx'

export default function AttendanceTrackerPage() {
    const router = useRouter()
    const params = useParams()
    const meetingId = params.id as string

    const meeting = MOCK_UPCOMING_MEETINGS.find(m => m.id === meetingId)

    // Initialize state with all officers
    // Note: In a real app, strict null check might require handling if generateInitialAttendance returns undefined
    const [records, setRecords] = useState<AttendanceRecord[]>(() => generateInitialAttendance(meetingId))

    if (!meeting) return <div>Meeting not found</div>

    const toggleStatus = (officerId: string, status: 'present' | 'absent') => {
        setRecords(prev => prev.map(r =>
            r.officerId === officerId ? { ...r, status } : r
        ))
    }

    // Quorum Calculation
    const total = records.length
    const effectivePresent = records.filter(r => r.status === 'present').length
    const quorumMet = effectivePresent > (total / 2) // Simple majority rule

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <button
                    onClick={() => router.push('/dashboard/attendance')}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    一覧に戻る
                </button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{meeting.title}</h1>
                        <p className="text-gray-500 mt-1">{meeting.date} {meeting.startTime} 開始</p>
                    </div>

                    {/* Quorum Counter Card */}
                    <div className={`px-6 py-3 rounded-xl border ${quorumMet ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} flex items-center gap-4`}>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">定足数 (過半数)</div>
                            <div className={`text-2xl font-bold ${quorumMet ? 'text-green-700' : 'text-red-700'}`}>
                                {effectivePresent} / {total}
                            </div>
                        </div>
                        <div className="h-10 w-px bg-gray-200"></div>
                        <div className="text-sm">
                            {quorumMet ? (
                                <span className="flex items-center gap-1 text-green-700 font-bold">
                                    <Check className="h-4 w-4" /> 成立
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-red-700 font-bold">
                                    <X className="h-4 w-4" /> 不成立
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
                {records.map((record) => {
                    const officer = MOCK_OFFICERS.find(o => o.id === record.officerId)!
                    const isPresent = record.status === 'present'
                    const isAbsent = record.status === 'absent'

                    return (
                        <div key={record.officerId} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{officer.name}</div>
                                    <div className="text-xs text-gray-500 capitalize">{officer.role}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleStatus(officer.id, 'present')}
                                    className={clsx(
                                        "px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                                        isPresent
                                            ? "bg-green-100 text-green-800 ring-2 ring-green-500 ring-offset-1"
                                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    <Check className="h-4 w-4" />
                                    出席
                                </button>

                                <button
                                    onClick={() => toggleStatus(officer.id, 'absent')}
                                    className={clsx(
                                        "px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                                        isAbsent
                                            ? "bg-red-100 text-red-800 ring-2 ring-red-500 ring-offset-1"
                                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    <X className="h-4 w-4" />
                                    欠席
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
