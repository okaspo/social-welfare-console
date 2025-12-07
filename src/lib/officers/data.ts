
export type OfficerRole = 'director' | 'auditor' | 'councilor'
export type OfficerStatus = 'active' | 'expired' | 'resigned'

export interface Officer {
    id: string
    name: string
    role: OfficerRole
    termStartDate: string
    termEndDate: string
    status: OfficerStatus
}

export const MOCK_OFFICERS: Officer[] = [
    {
        id: '1',
        name: '福祉 太郎',
        role: 'director',
        termStartDate: '2025-06-25',
        termEndDate: '2027-06-25', // 2 years (Article 45-5)
        status: 'active'
    },
    {
        id: '2',
        name: '福祉 次郎',
        role: 'director',
        termStartDate: '2023-06-25',
        termEndDate: '2025-06-25', // Expiring/Expired
        status: 'expired'
    },
    {
        id: '3',
        name: '監査 三郎',
        role: 'auditor',
        termStartDate: '2023-06-25',
        termEndDate: '2027-06-25', // 4 years (Article 45-5 / 2 Article 41 ref)
        status: 'active'
    },
    {
        id: '4',
        name: '評議 花子',
        role: 'councilor',
        termStartDate: '2023-04-01',
        termEndDate: '2027-04-01', // 4 years (Article 41)
        status: 'active'
    }
]

export const ROLE_LABELS: Record<OfficerRole, string> = {
    director: '理事',
    auditor: '監事',
    councilor: '評議員'
}
