import Link from 'next/link'
import { Calendar, ChevronRight, FileText, Plus } from 'lucide-react'
import { createClient } from "@/lib/supabase/server"
import { MOCK_ATTENDANCE_LIST } from "@/lib/attendance/data"

async function getMeetings() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Mock Mode
    if (!supabaseUrl || !supabaseKey) {
        return MOCK_ATTENDANCE_LIST.map(m => ({
            id: m.id,
            title: m.meetingName,
            date: m.date,
            status: 'done' // Mock status
        }))
    }

    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('meetings')
            .select('id, title, date')
            .order('date', { ascending: false })

        if (error || !data) {
            return MOCK_ATTENDANCE_LIST.map(m => ({
                id: m.id,
                title: m.meetingName,
                date: m.date,
                status: 'done'
            }))
        }

        return data.map(m => ({
            ...m,
            status: new Date(m.date) < new Date() ? 'done' : 'scheduled'
        }))
    } catch {
        return MOCK_ATTENDANCE_LIST.map(m => ({
            id: m.id,
            title: m.meetingName,
            date: m.date,
            status: 'done'
        }))
    }
}

// ... imports
import { checkSubscriptionStatus } from "@/lib/subscription"

// ... getMeetings ...

export default async function MeetingListPage() {
    const meetings = await getMeetings()
    const supabase = await createClient()

    // Check Subscription Status
    let readOnly = false
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (profile?.organization_id) {
            const { status } = await checkSubscriptionStatus(profile.organization_id)
            if (status === 'canceled') {
                readOnly = true // Dropped user
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">会議管理</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        理事会・評議員会の開催予定、議事録、出席状況を管理します。
                    </p>
                    {readOnly && (
                        <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200 inline-block">
                            ※ 解約済みのため、新規開催は制限されています。
                        </div>
                    )}
                </div>
                {!readOnly && (
                    <Link
                        href="/swc/dashboard/meetings/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        新規開催
                    </Link>
                )}
            </div>


            <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">開催日</th>
                            <th className="px-6 py-3">会議名</th>
                            <th className="px-6 py-3">ステータス</th>
                            <th className="px-6 py-3 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {meetings.map((meeting) => (
                            <tr key={meeting.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4 font-mono text-gray-600">
                                    {meeting.date}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {meeting.title}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {meeting.status === 'done' ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            開催済
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            予定
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/dashboard/meetings/${meeting.id}`}
                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs transition-colors"
                                    >
                                        詳細へ
                                        <ChevronRight className="h-3 w-3" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {meetings.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        会議の予定はありません。
                    </div>
                )}
            </div>
        </div>
    )
}
