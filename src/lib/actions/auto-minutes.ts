'use server';

import { createClient } from '@/lib/supabase/server';
import { formatOfficialDate, toJapaneseEra } from '@/lib/utils/japanese-era';

// ============================================================================
// Types
// ============================================================================

interface ConsentRecord {
    officer_name: string;
    responded_at: string;
}

interface MinutesDraft {
    title: string;
    meetingType: string;
    date: string;
    content: string;
    consents: ConsentRecord[];
    generatedAt: string;
}

// ============================================================================
// Minutes Template Generator
// ============================================================================

function generateWrittenResolutionMinutes(params: {
    organizationName: string;
    meetingTitle: string;
    meetingDate: string;
    meetingContent: string;
    consents: ConsentRecord[];
    proposerName: string;
}): string {
    const { organizationName, meetingTitle, meetingDate, meetingContent, consents, proposerName } = params;

    const now = new Date();
    const formattedDate = formatOfficialDate(meetingDate);
    const generatedDate = formatOfficialDate(now);

    // Sort consents by response time
    const sortedConsents = [...consents].sort((a, b) =>
        new Date(a.responded_at).getTime() - new Date(b.responded_at).getTime()
    );

    const consentList = sortedConsents.map((c, i) =>
        `${i + 1}. ${c.officer_name}　（同意日時: ${toJapaneseEra(c.responded_at, 'full')}）`
    ).join('\n');

    return `
${organizationName}

${meetingTitle} 議事録（書面決議）

１．決議の方法
　　社会福祉法第45条の9第10項において準用する一般社団法人及び一般財団法人に関する
　　法律第96条の規定に基づき、理事の全員が書面により同意の意思表示をしたことにより、
　　本件議案は可決されたものとみなされた。

２．決議があったとみなされた日
　　${formattedDate}

３．議案の内容
${meetingContent.split('\n').map(line => `　　${line}`).join('\n')}

４．同意した理事
${consentList}

５．議事録作成に係る職務を行った理事
　　${proposerName}

　上記のとおり決議があったものとみなされたので、これを証するため本議事録を作成し、
議事録作成者が記名押印する。

　　${generatedDate}

　　　　　　　　　　　　　　　　　${organizationName}

　　　　　　　　　　　　　　　　　議事録作成者　理事　${proposerName}　　㊞

---
※本議事録は「S級AI事務局 葵さん」により自動生成されました。
※内容をご確認の上、必要に応じて修正してください。
`.trim();
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Check if all officers have agreed and generate minutes if so
 */
export async function checkAndGenerateAutoMinutes(meetingId: string): Promise<{
    success: boolean;
    generated: boolean;
    minutesDraft?: string;
    error?: string;
}> {
    const supabase = await createClient();

    // Get meeting details
    const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select(`
            *,
            organization:organizations (
                name
            )
        `)
        .eq('id', meetingId)
        .single();

    if (meetingError || !meeting) {
        return { success: false, generated: false, error: 'Meeting not found' };
    }

    // Check if already generated
    if (meeting.auto_minutes_generated) {
        return { success: true, generated: false, error: 'Minutes already generated' };
    }

    // Only for written resolutions
    if (meeting.meeting_type !== 'omission') {
        return { success: true, generated: false, error: 'Not a written resolution meeting' };
    }

    // Get all consent records
    const { data: consents } = await supabase
        .from('meeting_consents')
        .select(`
            status,
            responded_at,
            officer:officers (
                name
            )
        `)
        .eq('meeting_id', meetingId);

    if (!consents || consents.length === 0) {
        return { success: false, generated: false, error: 'No consent records found' };
    }

    // Check if all agreed
    const allAgreed = consents.every(c => c.status === 'agreed');
    if (!allAgreed) {
        const pending = consents.filter(c => c.status !== 'agreed').length;
        return { success: true, generated: false, error: `${pending} officers have not agreed yet` };
    }

    // Get proposer (current user)
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

    const proposerName = profile?.full_name || '理事';

    // Generate minutes
    const minutesDraft = generateWrittenResolutionMinutes({
        organizationName: (meeting.organization as { name: string })?.name || '当法人',
        meetingTitle: meeting.title,
        meetingDate: meeting.date,
        meetingContent: meeting.content || '',
        consents: consents.map(c => ({
            officer_name: (c.officer as { name: string })?.name || 'Unknown',
            responded_at: c.responded_at || new Date().toISOString()
        })),
        proposerName
    });

    // Mark as generated
    await supabase
        .from('meetings')
        .update({ auto_minutes_generated: true })
        .eq('id', meetingId);

    // Optionally save to private_documents
    if (meeting.organization_id) {
        await supabase
            .from('private_documents')
            .insert({
                organization_id: meeting.organization_id,
                title: `${meeting.title} 議事録（書面決議）`,
                content: minutesDraft,
                document_type: 'minutes'
            });
    }

    return {
        success: true,
        generated: true,
        minutesDraft
    };
}

/**
 * Get auto-generated minutes for a meeting
 */
export async function getAutoMinutes(meetingId: string): Promise<string | null> {
    const supabase = await createClient();

    const { data: meeting } = await supabase
        .from('meetings')
        .select('title')
        .eq('id', meetingId)
        .single();

    if (!meeting) return null;

    // Find the auto-generated document
    const { data: doc } = await supabase
        .from('private_documents')
        .select('content')
        .ilike('title', `%${meeting.title}%議事録%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    return doc?.content || null;
}
