'use client'

import Link from 'next/link'
import { Calendar, ChevronRight, Users } from 'lucide-react'
import { MOCK_UPCOMING_MEETINGS, UpcomingMeeting } from '@/lib/attendance/data'

export default function AttendanceListPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">出席管理（デジタル出席簿）</h1>
            </div>

            <div className="grid gap-4">
                {MOCK_UPCOMING_MEETINGS.map((meeting) => (
                    <Link
                        key={meeting.id}
                        href={`/dashboard/attendance/${meeting.id}`}
                        className="group p-6 bg-white border border-gray-100 rounded-lg hover:border-gray-900/10 hover:shadow-md transition-all flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-colors">
                                <Calendar className="h-6 w-6 text-gray-400 group-hover:text-gray-900" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${meeting.type === 'board' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                        }`}>
                                        {meeting.type === 'board' ? '理事会' : '評議員会'}
                                    </span>
                                    <span className="text-xs text-gray-500">{meeting.date} {meeting.startTime}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                                    {meeting.title}
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2 mr-4">
                                {/* Mock Avatars */}
                                <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-500">A</div>
                                <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-500">B</div>
                                <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-400 font-medium">+4</div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
