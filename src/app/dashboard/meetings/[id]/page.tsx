import AttendanceSheet from "@/components/attendance/attendance-sheet"
import { createClient } from "@/lib/supabase/server"
import { MOCK_ATTENDANCE, MOCK_ATTENDANCE_LIST, MeetingAttendance } from "@/lib/attendance/data"
import { ChevronRight, FileText } from 'lucide-react'
import Link from 'next/link'

async function getMeeting(id: string): Promise<MeetingAttendance | null> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Mock Mode
    if (!supabaseUrl || !supabaseKey) {
        const found = MOCK_ATTENDANCE_LIST.find(m => m.id === id)
        return found || null
    }

    try {
        const supabase = await createClient()

        const { data: meetingData, error: meetingError } = await supabase
            .from('meetings')
            .select('*')
            .eq('id', id)
            .single()

        if (meetingError || !meetingData) {
            return null
        }

        const { data: recordsData, error: recordsError } = await supabase
            .from('attendance_records')
            .select('*, officer:officers(name, role)')
            .eq('meeting_id', meetingData.id)

        if (recordsError) {
            return null
        }

        const records = recordsData.map((r: any) => ({
            officerId: r.officer_id,
            name: r.officer.name,
            role: r.officer.role,
            status: r.status,
            isSigned: r.is_signed
        }))

        return {
            id: meetingData.id,
            meetingName: meetingData.title,
            date: meetingData.date,
            totalDirectors: 6,
            quorumRequired: meetingData.quorum_required || 4,
            records: records
        } as MeetingAttendance

    } catch (e) {
        return null
    }
}

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const meeting = await getMeeting(id)

    if (!meeting) {
        return <div>Meeting not found</div>
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/dashboard/meetings" className="hover:text-gray-900 transition-colors">
                    会議一覧
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="font-medium text-gray-900">{meeting.date} {meeting.meetingName}</span>
            </div>

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    {meeting.meetingName}
                </h1>
                <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors">
                        <FileText className="h-4 w-4" />
                        議事録作成
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* Attendance Section */}
                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-gray-900">出席簿・定足数</h2>
                        <p className="text-sm text-gray-500">
                            この会議の出席状況を管理します。変更は自動的に保存されます（モックモードではメモリ内のみ）。
                        </p>
                    </div>
                    <AttendanceSheet initialMeeting={meeting} />
                </section>
            </div>
        </div>
    )
}
