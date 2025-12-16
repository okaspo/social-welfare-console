// Terminology Mapping System
// Maps UI terms based on entity type for correct legal language

import { EntityType, getEntityConfig } from './config';

export type TermKey =
    | 'jurisdiction'
    | 'legalBasis'
    | 'boardMeeting'
    | 'councilMeeting'
    | 'statusReport'
    | 'bylaws'
    | 'fiscalYear';

const TERMINOLOGY_MAP: Record<EntityType, Record<TermKey, string>> = {
    social_welfare: {
        jurisdiction: '所轄庁（都道府県・市）',
        legalBasis: '社会福祉法',
        boardMeeting: '理事会',
        councilMeeting: '評議員会',
        statusReport: '現況報告書',
        bylaws: '定款',
        fiscalYear: '事業年度'
    },
    npo: {
        jurisdiction: '所轄庁（都道府県・内閣府）',
        legalBasis: 'NPO法（特定非営利活動促進法）',
        boardMeeting: '理事会',
        councilMeeting: '社員総会',
        statusReport: '事業報告書',
        bylaws: '定款',
        fiscalYear: '事業年度'
    },
    medical_corp: {
        jurisdiction: '行政庁（都道府県知事）',
        legalBasis: '医療法',
        boardMeeting: '理事会',
        councilMeeting: '社員総会',
        statusReport: '事業報告書',
        bylaws: '定款',
        fiscalYear: '事業年度'
    },
    general_inc: {
        jurisdiction: '行政機関',
        legalBasis: '一般社団法人及び一般財団法人に関する法律',
        boardMeeting: '理事会',
        councilMeeting: '社員総会',
        statusReport: '事業報告書',
        bylaws: '定款',
        fiscalYear: '事業年度'
    }
};

export function getTerm(entityType: EntityType, key: TermKey): string {
    return TERMINOLOGY_MAP[entityType][key] || key;
}

export function getAllTerms(entityType: EntityType): Record<TermKey, string> {
    return TERMINOLOGY_MAP[entityType];
}
