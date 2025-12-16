// Entity Configuration System
// Centralizes all entity-specific settings for multi-entity support

export type EntityType = 'social_welfare' | 'medical_corp' | 'npo' | 'general_inc';

export interface EntityConfig {
    type: EntityType;
    name: string;
    nameEn: string;

    // Legal framework
    legalBasis: string;
    jurisdictionTerm: string;

    // Officer roles
    roles: {
        [roleCode: string]: {
            label: string;
            termYears: number;
            required?: boolean;
        };
    };

    // Compliance rules
    complianceRules: {
        relativeRatioLimit?: number; // e.g., 1/3 for social_welfare
        mandatoryOfficers?: string[];
    };

    // Prompt modules
    promptModules: {
        lawModule: string;
        functionalModules: string[];
    };
}

export const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
    social_welfare: {
        type: 'social_welfare',
        name: '社会福祉法人',
        nameEn: 'Social Welfare Corporation',
        legalBasis: '社会福祉法',
        jurisdictionTerm: '所轄庁（都道府県・市）',
        roles: {
            director: { label: '理事', termYears: 2, required: true },
            auditor: { label: '監事', termYears: 4, required: true },
            councilor: { label: '評議員', termYears: 4, required: true },
            selection_committee: { label: '評議員選任解任委員', termYears: 4 }
        },
        complianceRules: {
            relativeRatioLimit: 1 / 3,
            mandatoryOfficers: ['director', 'auditor', 'councilor']
        },
        promptModules: {
            lawModule: 'mod_social_welfare_law',
            functionalModules: ['mod_minutes', 'mod_officers', 'mod_articles']
        }
    },

    npo: {
        type: 'npo',
        name: 'NPO法人',
        nameEn: 'NPO Corporation',
        legalBasis: 'NPO法（特定非営利活動促進法）',
        jurisdictionTerm: '所轄庁（都道府県・内閣府）',
        roles: {
            director: { label: '理事', termYears: 2, required: true },
            auditor: { label: '監事', termYears: 2, required: true }
        },
        complianceRules: {
            relativeRatioLimit: undefined,
            mandatoryOfficers: ['director', 'auditor']
        },
        promptModules: {
            lawModule: 'mod_npo_law',
            functionalModules: ['mod_minutes', 'mod_officers', 'mod_articles']
        }
    },

    medical_corp: {
        type: 'medical_corp',
        name: '医療法人',
        nameEn: 'Medical Corporation',
        legalBasis: '医療法',
        jurisdictionTerm: '行政庁',
        roles: {
            director: { label: '理事', termYears: 2, required: true },
            auditor: { label: '監事', termYears: 2, required: true },
            member: { label: '社員', termYears: 100 }
        },
        complianceRules: {
            relativeRatioLimit: undefined,
            mandatoryOfficers: ['director', 'auditor']
        },
        promptModules: {
            lawModule: 'mod_medical_care_act',
            functionalModules: ['mod_minutes', 'mod_officers', 'mod_articles']
        }
    },

    general_inc: {
        type: 'general_inc',
        name: '一般社団法人',
        nameEn: 'General Incorporated Association',
        legalBasis: '一般社団法人及び一般財団法人に関する法律',
        jurisdictionTerm: '行政機関',
        roles: {
            director: { label: '理事', termYears: 2, required: true },
            auditor: { label: '監事', termYears: 2 },
            member: { label: '社員', termYears: 100 }
        },
        complianceRules: {
            relativeRatioLimit: undefined,
            mandatoryOfficers: ['director']
        },
        promptModules: {
            lawModule: 'mod_general_inc_act',
            functionalModules: ['mod_minutes', 'mod_officers', 'mod_articles']
        }
    }
};

// Helper functions
export function getEntityConfig(entityType: EntityType): EntityConfig {
    return ENTITY_CONFIGS[entityType];
}

export function getRoleLabel(entityType: EntityType, roleCode: string): string {
    return ENTITY_CONFIGS[entityType].roles[roleCode]?.label || roleCode;
}

export function getTermYears(entityType: EntityType, roleCode: string): number {
    return ENTITY_CONFIGS[entityType].roles[roleCode]?.termYears || 2;
}

export function getValidRoles(entityType: EntityType): string[] {
    return Object.keys(ENTITY_CONFIGS[entityType].roles);
}

export function isRoleValid(entityType: EntityType, roleCode: string): boolean {
    return roleCode in ENTITY_CONFIGS[entityType].roles;
}
