'use server';

import { createClient } from '@/lib/supabase/server';
import {
    toJapaneseEra,
    toJapaneseEraBirthDate,
    calculateAge,
    formatOfficialDate
} from '@/lib/utils/japanese-era';
import ExcelJS from 'exceljs';

// ============================================================================
// Types
// ============================================================================

interface OfficerData {
    no: number;
    name: string;
    birthDate: string;
    age: number;
    address: string;
    occupation: string;
    role: string;
    roleLabel: string;
    termStart: string;
    termEnd: string;
    isRemunerated: boolean;
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
// Excel Generation
// ============================================================================

/**
 * Generate officer registry Excel file
 * Returns base64 encoded Excel data
 */
export async function generateOfficerRegistryExcel(): Promise<{
    success: boolean;
    data?: string;
    filename?: string;
    error?: string;
}> {
    const supabase = await createClient();

    // Get current user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return { success: false, error: 'No organization' };
    }

    // Get organization info
    const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', profile.organization_id)
        .single();

    // Get all active officers
    const { data: officers, error } = await supabase
        .from('officers')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('role', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        return { success: false, error: 'Failed to fetch officers' };
    }

    // Transform data
    const officerData: OfficerData[] = (officers || []).map((officer, index) => ({
        no: index + 1,
        name: officer.name,
        birthDate: officer.date_of_birth
            ? toJapaneseEraBirthDate(officer.date_of_birth)
            : '',
        age: officer.date_of_birth
            ? calculateAge(officer.date_of_birth)
            : 0,
        address: officer.address || '',
        occupation: officer.occupation || '',
        role: officer.role,
        roleLabel: ROLE_LABELS[officer.role] || officer.role,
        termStart: officer.term_start
            ? formatOfficialDate(officer.term_start)
            : '',
        termEnd: officer.term_end
            ? formatOfficialDate(officer.term_end)
            : '',
        isRemunerated: officer.is_remunerated || false
    }));

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'S級AI事務局 葵さん';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('役員名簿', {
        pageSetup: {
            paperSize: 9, // A4
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0
        }
    });

    // Set column widths
    worksheet.columns = [
        { header: 'No.', key: 'no', width: 5 },
        { header: '氏名', key: 'name', width: 15 },
        { header: '生年月日', key: 'birthDate', width: 18 },
        { header: '年齢', key: 'age', width: 6 },
        { header: '住所', key: 'address', width: 35 },
        { header: '職業', key: 'occupation', width: 15 },
        { header: '役職', key: 'roleLabel', width: 12 },
        { header: '就任日', key: 'termStart', width: 18 },
        { header: '任期満了日', key: 'termEnd', width: 18 },
        { header: '報酬', key: 'isRemunerated', width: 6 }
    ];

    // Title row
    const orgName = org?.name || '法人名';
    worksheet.insertRow(1, []);
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${orgName} 役員名簿`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Date row
    worksheet.insertRow(2, []);
    worksheet.mergeCells('A2:J2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `作成日: ${formatOfficialDate(new Date())}`;
    dateCell.font = { size: 10 };
    dateCell.alignment = { horizontal: 'right' };

    // Header row styling
    const headerRow = worksheet.getRow(4);
    headerRow.values = ['No.', '氏名', '生年月日', '年齢', '住所', '職業', '役職', '就任日', '任期満了日', '報酬'];
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add border to header
    headerRow.eachCell((cell) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Data rows
    officerData.forEach((officer, index) => {
        const row = worksheet.addRow({
            no: officer.no,
            name: officer.name,
            birthDate: officer.birthDate,
            age: officer.age || '',
            address: officer.address,
            occupation: officer.occupation,
            roleLabel: officer.roleLabel,
            termStart: officer.termStart,
            termEnd: officer.termEnd,
            isRemunerated: officer.isRemunerated ? '有' : '無'
        });

        // Style data rows
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle' };
        });

        // Center alignment for specific columns
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Footer
    const footerRowNum = 5 + officerData.length + 1;
    worksheet.mergeCells(`A${footerRowNum}:J${footerRowNum}`);
    const footerCell = worksheet.getCell(`A${footerRowNum}`);
    footerCell.value = '※本名簿は「S級AI事務局 葵さん」により自動生成されました。';
    footerCell.font = { size: 9, italic: true, color: { argb: 'FF666666' } };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    const today = new Date().toISOString().split('T')[0];
    const filename = `役員名簿_${orgName}_${today}.xlsx`;

    return {
        success: true,
        data: base64,
        filename
    };
}
