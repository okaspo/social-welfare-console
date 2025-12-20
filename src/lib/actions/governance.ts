'use server';

import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email/resend';

// ============================================================================
// Types
// ============================================================================

export type MeetingType = 'physical' | 'hybrid' | 'omission';

export type CreateMeetingInput = {
    title: string;
    date: string;
    time: string;
    place: string;
    content: string;
    meeting_type: MeetingType;
    days_notice_required?: number;
    officer_ids: string[];
};

export type MeetingConsent = {
    id: string;
    officer_id: string;
    officer_name: string;
    officer_email: string | null;
    status: 'pending' | 'viewed' | 'agreed' | 'rejected';
    responded_at: string | null;
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateSecureToken(): string {
    return randomBytes(32).toString('hex');
}

function getConsentUrl(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
        'http://localhost:3000';
    return `${baseUrl}/consent/${token}`;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Create a meeting and generate consent records for specified officers
 */
export async function createMeetingWithConsents(input: CreateMeetingInput) {
    const supabase = await createClient();

    // Get current user's organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        throw new Error('User has no organization');
    }

    // Create meeting
    const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
            organization_id: profile.organization_id,
            title: input.title,
            date: input.date,
            time: input.time,
            place: input.place,
            content: input.content,
            meeting_type: input.meeting_type,
            days_notice_required: input.days_notice_required || 7
        })
        .select()
        .single();

    if (meetingError || !meeting) {
        console.error('Failed to create meeting:', meetingError);
        throw new Error('Failed to create meeting');
    }

    // Get officer details (only those with email)
    const { data: officers, error: officersError } = await supabase
        .from('officers')
        .select('id, name, email')
        .in('id', input.officer_ids)
        .eq('organization_id', profile.organization_id);

    if (officersError) {
        console.error('Failed to fetch officers:', officersError);
        throw new Error('Failed to fetch officers');
    }

    // Generate consent records with magic link tokens
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 30); // 30 days validity

    const consentRecords = (officers || []).map(officer => ({
        meeting_id: meeting.id,
        officer_id: officer.id,
        token: generateSecureToken(),
        token_expires_at: tokenExpiry.toISOString(),
        status: 'pending'
    }));

    if (consentRecords.length > 0) {
        const { error: consentError } = await supabase
            .from('meeting_consents')
            .insert(consentRecords);

        if (consentError) {
            console.error('Failed to create consent records:', consentError);
            throw new Error('Failed to create consent records');
        }
    }

    return {
        success: true,
        meetingId: meeting.id,
        consentCount: consentRecords.length
    };
}

/**
 * Send convocation notices to all pending officers for a meeting
 */
export async function sendConvocationNotices(meetingId: string) {
    const supabase = await createClient();

    // Verify user has access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    // Get meeting with organization info
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
        throw new Error('Meeting not found');
    }

    // Get pending consent records with officer info
    const { data: consents, error: consentsError } = await supabase
        .from('meeting_consents')
        .select(`
            id,
            token,
            officer:officers (
                name,
                email
            )
        `)
        .eq('meeting_id', meetingId)
        .eq('status', 'pending');

    if (consentsError) {
        throw new Error('Failed to fetch consent records');
    }

    const results: { success: boolean; officerName: string; error?: string }[] = [];

    for (const consent of consents || []) {
        const officer = consent.officer as { name: string; email: string | null };

        if (!officer?.email) {
            results.push({
                success: false,
                officerName: officer?.name || 'Unknown',
                error: 'No email address'
            });
            continue;
        }

        const consentUrl = getConsentUrl(consent.token);
        const orgName = (meeting.organization as { name: string })?.name || '当法人';

        const html = generateConvocationHtml({
            organizationName: orgName,
            meetingTitle: meeting.title,
            meetingDate: meeting.date,
            meetingTime: meeting.time,
            meetingPlace: meeting.place,
            meetingContent: meeting.content,
            meetingType: meeting.meeting_type,
            officerName: officer.name,
            consentUrl
        });

        const emailResult = await sendEmail({
            to: officer.email,
            subject: `【${orgName}】${meeting.title} - ${meeting.meeting_type === 'omission' ? '書面決議のお願い' : '招集通知'}`,
            html
        });

        results.push({
            success: emailResult.success,
            officerName: officer.name,
            error: emailResult.success ? undefined : String(emailResult.error)
        });
    }

    // Update notification_sent_at
    await supabase
        .from('meetings')
        .update({ notification_sent_at: new Date().toISOString() })
        .eq('id', meetingId);

    const successCount = results.filter(r => r.success).length;

    return {
        success: true,
        sent: successCount,
        failed: results.length - successCount,
        details: results
    };
}

/**
 * Get meeting with consent status summary
 */
export async function getMeetingWithConsents(meetingId: string) {
    const supabase = await createClient();

    const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

    if (meetingError || !meeting) {
        return null;
    }

    const { data: consents } = await supabase
        .from('meeting_consents')
        .select(`
            id,
            status,
            responded_at,
            officer:officers (
                id,
                name,
                email
            )
        `)
        .eq('meeting_id', meetingId);

    return {
        ...meeting,
        consents: (consents || []).map(c => ({
            id: c.id,
            status: c.status,
            responded_at: c.responded_at,
            officer_id: (c.officer as { id: string })?.id,
            officer_name: (c.officer as { name: string })?.name,
            officer_email: (c.officer as { email: string | null })?.email
        }))
    };
}

/**
 * List all meetings for current user's organization
 */
export async function getOrganizationMeetings() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return [];

    const { data: meetings } = await supabase
        .from('meetings')
        .select(`
            id,
            title,
            date,
            time,
            meeting_type,
            notification_sent_at,
            auto_minutes_generated
        `)
        .eq('organization_id', profile.organization_id)
        .order('date', { ascending: false });

    // Get consent stats for each meeting
    const meetingsWithStats = await Promise.all(
        (meetings || []).map(async (meeting) => {
            const { data: consents } = await supabase
                .from('meeting_consents')
                .select('status')
                .eq('meeting_id', meeting.id);

            const total = consents?.length || 0;
            const agreed = consents?.filter(c => c.status === 'agreed').length || 0;

            return {
                ...meeting,
                consent_total: total,
                consent_agreed: agreed,
                consent_rate: total > 0 ? Math.round((agreed / total) * 100) : 0
            };
        })
    );

    return meetingsWithStats;
}

// ============================================================================
// Email Template
// ============================================================================

function generateConvocationHtml(params: {
    organizationName: string;
    meetingTitle: string;
    meetingDate: string;
    meetingTime: string;
    meetingPlace: string;
    meetingContent: string;
    meetingType: string;
    officerName: string;
    consentUrl: string;
}): string {
    const isOmission = params.meetingType === 'omission';
    const actionText = isOmission ? '書面決議への同意' : '出欠回答';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: #1e293b; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: bold;">
                ${isOmission ? '書面決議のお願い' : '招集通知'}
            </h1>
            <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">
                ${params.organizationName}
            </p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
            <p style="margin: 0 0 24px; color: #374151;">
                ${params.officerName} 様
            </p>

            <p style="margin: 0 0 24px; color: #374151; line-height: 1.8;">
                ${isOmission
            ? '下記の議案について、書面による決議をお願いいたします。'
            : '下記のとおり会議を開催いたしますので、ご出席くださいますようお願い申し上げます。'}
            </p>

            <!-- Meeting Details Box -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; font-size: 18px; color: #1e293b;">
                    ${params.meetingTitle}
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; width: 80px;">日時</td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">
                            ${params.meetingDate} ${params.meetingTime}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b;">場所</td>
                        <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">
                            ${params.meetingPlace}
                        </td>
                    </tr>
                </table>
            </div>

            <!-- Agenda -->
            <div style="margin-bottom: 32px;">
                <h3 style="margin: 0 0 12px; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
                    議案
                </h3>
                <div style="color: #374151; line-height: 1.8; white-space: pre-wrap;">
${params.meetingContent}
                </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
                <a href="${params.consentUrl}" 
                   style="display: inline-block; background-color: #4f46e5; color: white; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                    ${actionText}はこちら
                </a>
            </div>

            <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                ※このリンクは30日間有効です。<br>
                ※回答日時とIPアドレスは監査証跡として記録されます。
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Sent via GovAI Console - S級AI事務局 葵さん
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
}
