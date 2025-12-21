'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

interface TermExpiryAlert {
    officerId: string;
    officerName: string;
    role: string;
    termEndDate: string;
    daysRemaining: number;
}

interface MeetingReminder {
    meetingId: string;
    meetingTitle: string;
    meetingDate: string;
    pendingConsents: number;
}

// ============================================================================
// Alert Detection
// ============================================================================

/**
 * Get officers with upcoming term expiry (within 90 days)
 */
export async function getTermExpiryAlerts(): Promise<TermExpiryAlert[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return [];

    const today = new Date();
    const ninetyDaysFromNow = new Date(today);
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    const { data: officers } = await supabase
        .from('officers')
        .select('id, name, role, term_end')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .gte('term_end', today.toISOString().split('T')[0])
        .lte('term_end', ninetyDaysFromNow.toISOString().split('T')[0])
        .order('term_end', { ascending: true });

    return (officers || []).map(officer => {
        const termEnd = new Date(officer.term_end);
        const daysRemaining = Math.ceil((termEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return {
            officerId: officer.id,
            officerName: officer.name,
            role: officer.role,
            termEndDate: officer.term_end,
            daysRemaining
        };
    });
}

/**
 * Get meetings with pending consent responses
 */
export async function getPendingConsentReminders(): Promise<MeetingReminder[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return [];

    // Get meetings with pending consents
    const { data: meetings } = await supabase
        .from('meetings')
        .select(`
            id,
            title,
            date,
            meeting_consents (
                status
            )
        `)
        .eq('organization_id', profile.organization_id)
        .eq('meeting_type', 'omission')
        .gte('date', new Date().toISOString().split('T')[0]);

    return (meetings || [])
        .map(meeting => {
            const consents = meeting.meeting_consents as { status: string }[] || [];
            const pendingCount = consents.filter(c => c.status !== 'agreed').length;

            return {
                meetingId: meeting.id,
                meetingTitle: meeting.title,
                meetingDate: meeting.date,
                pendingConsents: pendingCount
            };
        })
        .filter(m => m.pendingConsents > 0);
}

// ============================================================================
// Email Templates
// ============================================================================

export function generateTermExpiryEmailHtml(alerts: TermExpiryAlert[], orgName: string): string {
    const alertRows = alerts.map(alert => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${alert.officerName}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${getRoleLabel(alert.role)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${alert.termEndDate}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; color: ${alert.daysRemaining <= 30 ? '#dc2626' : '#f59e0b'};">
                残り ${alert.daysRemaining} 日
            </td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>役員任期満了アラート</title>
    </head>
    <body style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background: #4f46e5; color: white; padding: 20px;">
                <h1 style="margin: 0; font-size: 20px;">役員任期満了アラート</h1>
                <p style="margin: 8px 0 0; opacity: 0.9;">${orgName}</p>
            </div>
            
            <div style="padding: 20px;">
                <p>以下の役員の任期が近日中に満了します。早めの対応をお願いいたします。</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                        <tr style="background: #f9fafb;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">氏名</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">役職</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">任期満了日</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">残日数</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${alertRows}
                    </tbody>
                </table>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;">
                    <strong>ご対応のお願い</strong>
                    <p style="margin: 8px 0 0; font-size: 14px;">再任または後任者の選任手続きを進めてください。</p>
                </div>
            </div>
            
            <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #6b7280;">
                このメールは「S級AI事務局 葵さん」から自動送信されています。
            </div>
        </div>
    </body>
    </html>
    `;
}

function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        director: '理事',
        auditor: '監事',
        councilor: '評議員',
        representative_director: '理事長',
        executive_director: '業務執行理事'
    };
    return labels[role] || role;
}
