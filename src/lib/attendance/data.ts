
import { MOCK_OFFICERS, Officer } from "../officers/data"

export type AttendanceStatus = 'present' | 'absent'

export interface AttendanceRecord {
    meetingId: string
    officerId: string
    status: AttendanceStatus
}

export interface UpcomingMeeting {
    id: string
    title: string
    date: string
    startTime: string
    type: 'board' | 'council'
    status: 'scheduled' | 'active' | 'completed'
}

export const MOCK_UPCOMING_MEETINGS: UpcomingMeeting[] = [
    {
        id: 'm-1',
        title: '第1回 定時理事会',
        date: '2025-06-25',
        startTime: '14:00',
        type: 'board',
        status: 'scheduled'
    },
    {
        id: 'm-2',
        title: '臨時理事会（予算承認）',
        date: '2025-03-31',
        startTime: '10:00',
        type: 'board',
        status: 'completed'
    }
]

// Mock initial attendance state (everyone present by default or empty)
export const generateInitialAttendance = (meetingId: string): AttendanceRecord[] => {
    return MOCK_OFFICERS.map(officer => ({
        meetingId,
        officerId: officer.id,
        status: 'present'
    }))
}
