

export type OfficerRole = 'director' | 'auditor' | 'councilor' | 'selection_committee'
export type OfficerStatus = 'active' | 'expired' | 'resigned'

// Configuration Interface for different entity types
export interface CorporationConfig {
    type: 'social_welfare' | 'medical' | 'npo'
    name: string
    roles: Partial<Record<OfficerRole, {
        label: string
        termYears: number
    }>>
}

// Configuration Map
export const CORPORATION_CONFIGS: Record<string, CorporationConfig> = {
    social_welfare: {
        type: 'social_welfare',
        name: '社会福祉法人',
        roles: {
            director: { label: '理事', termYears: 2 },
            auditor: { label: '監事', termYears: 4 }, // Can be 2 in some cases, but 4 is standard max
            councilor: { label: '評議員', termYears: 4 },
            selection_committee: { label: '評議員選任解任委員', termYears: 4 }
        }
    },
    medical: {
        type: 'medical',
        name: '医療法人',
        roles: {
            director: { label: '理事', termYears: 2 },
            auditor: { label: '監事', termYears: 2 },
            councilor: { label: '社員', termYears: 100 } // "Shain" often has no term, effectively indefinite or varied
        }
    },
    npo: {
        type: 'npo',
        name: 'NPO法人',
        roles: {
            director: { label: '理事', termYears: 2 },
            auditor: { label: '監事', termYears: 2 }
            // No Councilor in standard NPO
        }
    }
}

// Current Active Config (In a real app, this would come from a Context or Global State)
export const CURRENT_CONFIG_TYPE: 'social_welfare' | 'medical' | 'npo' = 'social_welfare'

export const getRoleLabel = (role: OfficerRole, type = CURRENT_CONFIG_TYPE): string => {
    return CORPORATION_CONFIGS[type].roles[role]?.label || role
}

export const getTermLimitYears = (role: OfficerRole, type = CURRENT_CONFIG_TYPE): number => {
    return CORPORATION_CONFIGS[type].roles[role]?.termYears || 2
}

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
        termEndDate: '2027-06-25', // 2 years
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
        termEndDate: '2027-06-25', // 4 years
        status: 'active'
    },
    {
        id: '4',
        name: '評議 花子',
        role: 'councilor',
        termStartDate: '2023-04-01',
        termEndDate: '2027-04-01', // 4 years
        status: 'active'
    }
]
