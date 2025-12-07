
export interface AttendanceRecord {
    officerId: string
    name: string
    role: string
    status: 'attended' | 'absent' | 'online'
    isSigned: boolean
}

export interface MeetingAttendance {
    id: string
    meetingName: string
    date: string
    totalDirectors: number // Teikan teisu
    quorumRequired: number // Usually majority
    records: AttendanceRecord[]
}

export const MOCK_ATTENDANCE_LIST: MeetingAttendance[] = [
    {
        id: 'm-2024-06-25',
        meetingName: '第1回 定時理事会',
        date: '2024-06-25',
        totalDirectors: 6,
        quorumRequired: 4,
        records: [
            { officerId: '1', name: '福祉 太郎', role: '理事長', status: 'attended', isSigned: true },
            { officerId: '2', name: '福祉 次郎', role: '業務執行理事', status: 'attended', isSigned: true },
            { officerId: '3', name: '社会 花子', role: '理事', status: 'online', isSigned: false },
            { officerId: '4', name: '地域 守', role: '理事', status: 'absent', isSigned: false },
            { officerId: '5', name: '医療 健太', role: '理事', status: 'absent', isSigned: false },
            { officerId: '6', name: '介護 良子', role: '理事', status: 'attended', isSigned: true },
            { officerId: '7', name: '監査 三郎', role: '監事', status: 'attended', isSigned: true },
            { officerId: '8', name: '監査 四郎', role: '監事', status: 'absent', isSigned: false }
        ]
    },
    {
        id: 'm-2024-03-31',
        meetingName: '第4回 臨時理事会',
        date: '2024-03-31',
        totalDirectors: 6,
        quorumRequired: 4,
        records: [
            { officerId: '1', name: '福祉 太郎', role: '理事長', status: 'attended', isSigned: true },
            { officerId: '2', name: '福祉 次郎', role: '業務執行理事', status: 'attended', isSigned: true },
            { officerId: '3', name: '社会 花子', role: '理事', status: 'attended', isSigned: true },
            { officerId: '4', name: '地域 守', role: '理事', status: 'attended', isSigned: true },
            { officerId: '5', name: '医療 健太', role: '理事', status: 'attended', isSigned: true },
            { officerId: '6', name: '介護 良子', role: '理事', status: 'attended', isSigned: true },
            { officerId: '7', name: '監査 三郎', role: '監事', status: 'attended', isSigned: true },
            { officerId: '8', name: '監査 四郎', role: '監事', status: 'attended', isSigned: true }
        ]
    }
]

export const MOCK_ATTENDANCE = MOCK_ATTENDANCE_LIST[0]
