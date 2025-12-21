'use server';

import { createClient } from '@/lib/supabase/server';
import {
    toJapaneseEra,
    toJapaneseEraBirthDate,
    calculateAge,
    formatOfficialDate
} from '@/lib/utils/japanese-era';

// ============================================================================
// Types
// ============================================================================

export interface OfficerRegistryRow {
    no: number;
    name: string;
    birthDate: string;      // Japanese era format
    age: number;
    address: string;
    occupation: string;
    role: string;
    termStart: string;      // Japanese era format
    termEnd: string;        // Japanese era format
    isRemunerated: boolean;
}

export interface OfficerRegistryData {
    organizationName: string;
    generatedAt: string;
    fiscalYear: string;
    officers: OfficerRegistryRow[];
    summary: {
        totalDirectors: number;
        totalAuditors: number;
        totalCouncilors: number;
        remuneratedCount: number;
    };
}

// Role labels mapping
const ROLE_LABELS: Record<string, string> = {
    director: '理事',
    auditor: '監事',
    councilor: '評議員',
    selection_committee: '評議員選任解任委員',
    representative_director: '理事長',
    executive_director: '業務執行理事'
};

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Generate officer registry data for export
 */
export async function generateOfficerRegistryData(): Promise<OfficerRegistryData | null> {
    const supabase = await createClient();

    // Get current user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return null;

    // Get organization info
    const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', profile.organization_id)
        .single();

    // Get all active officers with PII
    const { data: officers, error } = await supabase
        .from('officers')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('role', { ascending: true })
        .order('name', { ascending: true });

    if (error || !officers) return null;

    // Transform data
    const registryRows: OfficerRegistryRow[] = officers.map((officer, index) => ({
        no: index + 1,
        name: officer.name,
        birthDate: officer.date_of_birth
            ? toJapaneseEraBirthDate(officer.date_of_birth)
            : '未登録',
        age: officer.date_of_birth
            ? calculateAge(officer.date_of_birth)
            : 0,
        address: officer.address || '未登録',
        occupation: officer.occupation || '未登録',
        role: ROLE_LABELS[officer.role] || officer.role,
        termStart: officer.term_start
            ? formatOfficialDate(officer.term_start)
            : '-',
        termEnd: officer.term_end
            ? formatOfficialDate(officer.term_end)
            : '-',
        isRemunerated: officer.is_remunerated || false
    }));

    // Calculate summary
    const summary = {
        totalDirectors: officers.filter(o => o.role === 'director' || o.role === 'representative_director' || o.role === 'executive_director').length,
        totalAuditors: officers.filter(o => o.role === 'auditor').length,
        totalCouncilors: officers.filter(o => o.role === 'councilor').length,
        remuneratedCount: officers.filter(o => o.is_remunerated).length
    };

    // Get current fiscal year (April start)
    const now = new Date();
    const fiscalYear = now.getMonth() >= 3
        ? `${now.getFullYear()}年度`
        : `${now.getFullYear() - 1}年度`;

    return {
        organizationName: org?.name || '未設定法人',
        generatedAt: formatOfficialDate(new Date()),
        fiscalYear,
        officers: registryRows,
        summary
    };
}

/**
 * Generate officer registry as CSV string
 */
export async function exportOfficerRegistryCSV(): Promise<string | null> {
    const data = await generateOfficerRegistryData();
    if (!data) return null;

    const headers = [
        'No.',
        '氏名',
        '生年月日',
        '年齢',
        '住所',
        '職業',
        '役職',
        '就任日',
        '任期満了日',
        '報酬'
    ];

    const rows = data.officers.map(o => [
        o.no,
        o.name,
        o.birthDate,
        o.age,
        o.address,
        o.occupation,
        o.role,
        o.termStart,
        o.termEnd,
        o.isRemunerated ? '有' : '無'
    ]);

    const csvContent = [
        `# 役員名簿 - ${data.organizationName}`,
        `# 作成日: ${data.generatedAt}`,
        `# 年度: ${data.fiscalYear}`,
        '',
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

/**
 * Generate status report officer section data
 */
export async function generateStatusReportData() {
    const data = await generateOfficerRegistryData();
    if (!data) return null;

    return {
        ...data,
        // Additional fields for status report
        boardComposition: `理事 ${data.summary.totalDirectors}名、監事 ${data.summary.totalAuditors}名`,
        councilComposition: `評議員 ${data.summary.totalCouncilors}名`,
        remunerationSummary: `報酬対象者 ${data.summary.remuneratedCount}名`
    };
}
