'use client'

import { useState } from 'react'
import { Check, X, FileText, AlertCircle } from 'lucide-react'
import { MeetingAttendance, AttendanceRecord } from '@/lib/attendance/data'

interface AttendanceSheetProps {
    initialMeeting: MeetingAttendance
}

export default function AttendanceSheet({ initialMeeting }: AttendanceSheetProps) {
    const [meeting, setMeeting] = useState(initialMeeting)

    const toggleStatus = (officerId: string, newStatus: AttendanceRecord['status']) => {
        setMeeting(prev => ({
            ...prev,
            records: prev.records.map(r =>
                r.officerId === officerId ? { ...r, status: newStatus } : r
            )
        }))
    }

    const toggleSigned = (officerId: string) => {
        setMeeting(prev => ({
            ...prev,
            records: prev.records.map(r =>
                r.officerId === officerId ? { ...r, isSigned: !r.isSigned } : r
            )
        }))
    }

    // Quorum Calculation: Only Directors count for Board quorum
    const directors = meeting.records.filter(r => r.role.includes('理事'))
    const attendedCount = directors.filter(r => ['attended', 'online'].includes(r.status)).length
    const isQuorumMet = attendedCount >= meeting.quorumRequired

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className={`p-6 rounded-lg border ${isQuorumMet ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} transition-colors`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            {isQuorumMet ? (
                                <Check className="h-6 w-6 text-green-600" />
                            ) : (
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            )}
                            定足数確認: {isQuorumMet ? '成立' : '不成立'}
                        </h2>
                        <p className={`mt-1 text-sm ${isQuorumMet ? 'text-green-700' : 'text-red-700'}`}>
                            出席数: {attendedCount} / 理事定数: {meeting.totalDirectors} (必要数: {meeting.quorumRequired})
                        </p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">氏名 / 役職</th>
                            <th className="px-6 py-3 text-center">出席状況</th>
                            <th className="px-6 py-3 text-center">署名確認</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {meeting.records.map((record) => (
                            <tr key={record.officerId} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{record.name}</div>
                                    <div className="text-xs text-gray-500">{record.role}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => toggleStatus(record.officerId, 'attended')}
                                            className={`p-2 rounded-md border ${record.status === 'attended'
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                                                }`}
                                            title="出席"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(record.officerId, 'online')}
                                            className={`p-2 rounded-md border ${record.status === 'online'
                                                ? 'bg-purple-50 border-purple-200 text-purple-700'
                                                : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                                                }`}
                                            title="オンライン"
                                        >
                                            <span className="text-xs font-bold">PC</span>
                                        </button>

                                        <button
                                            onClick={() => toggleStatus(record.officerId, 'absent')}
                                            className={`p-2 rounded-md border ${record.status === 'absent'
                                                ? 'bg-red-50 border-red-200 text-red-700'
                                                : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                                                }`}
                                            title="欠席"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="text-center mt-1 text-xs text-gray-500 font-mono">
                                        {record.status === 'attended' && '出席'}
                                        {record.status === 'online' && 'オンライン'}

                                        {record.status === 'absent' && '欠席'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => toggleSigned(record.officerId)}
                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${record.isSigned
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {record.isSigned ? (
                                            <>
                                                <Check className="h-3 w-3" />
                                                署名済
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="h-3 w-3" />
                                                未署名
                                            </>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
