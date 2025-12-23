'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

export async function generateConsentToken(meetingId: string, officerId: string) {
    const supabase = await createClient();

    // 1. Check if token already exists
    const { data: existing } = await supabase
        .from('meeting_consents')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('officer_id', officerId)
        .single();

    if (existing) {
        // Extend expiration if expired
        if (new Date(existing.token_expires_at) < new Date()) {
            const newToken = randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 14); // 2 weeks validity

            await supabase
                .from('meeting_consents')
                .update({
                    token: newToken,
                    token_expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);

            revalidatePath(`/swc/dashboard/meetings/${meetingId}`);
            return newToken;
        }
        return existing.token;
    }

    // 2. Generate new token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 2 weeks validity

    const { error } = await supabase
        .from('meeting_consents')
        .insert({
            meeting_id: meetingId,
            officer_id: officerId,
            token,
            token_expires_at: expiresAt.toISOString(),
            status: 'pending'
        });

    if (error) {
        console.error('Failed to generate token', error);
        throw new Error('Failed to generate magic link');
    }

    revalidatePath(`/swc/dashboard/meetings/${meetingId}`);
    return token;
}

import { sendEmail } from '@/lib/email/resend';
import { logAudit } from '@/lib/logger';

export async function sendConvocationEmails(meetingId: string, officerIds?: string[]) {
    const supabase = await createClient();

    // Fetch Meeting Details
    const { data: meeting } = await supabase
        .from('meetings')
        .select(`
            *,
            organization:organizations(name)
        `)
        .eq('id', meetingId)
        .single();

    if (!meeting) return { error: 'Meeting not found' };

    // Fetch Officers (targets)
    let query = supabase.from('officers').select('*').eq('organization_id', meeting.organization_id).eq('is_active', true);
    if (officerIds && officerIds.length > 0) {
        query = query.in('id', officerIds);
    }
    const { data: officers } = await query;

    if (!officers || officers.length === 0) return { error: 'No officers found' };

    let sentCount = 0;
    const errors: string[] = [];

    // Send Emails Loop
    for (const officer of officers) {
        if (!officer.email) continue;

        try {
            const token = await generateConsentToken(meetingId, officer.id);
            const link = `${process.env.NEXT_PUBLIC_APP_URL}/consent/${token}`;

            const html = `
                <h2>${meeting.title} - 招集通知 / みなし決議提案</h2>
                <p>${officer.name} 殿</p>
                <p>以下の通り、会議（または書面決議）のご案内を申し上げます。</p>
                <hr />
                <p><strong>日時:</strong> ${meeting.date}</p>
                <p><strong>場所:</strong> ${meeting.place || '書面開催'}</p>
                <hr />
                <p>以下のリンクより、内容の確認と同意（または出欠登録）をお願いいたします。</p>
                <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:4px;">同意画面へ進む</a></p>
                <p><small>※本メールは、${meeting.organization?.name} の役員管理システムより自動送信されています。</small></p>
            `;

            const result = await sendEmail({
                to: officer.email,
                subject: `【重要】${meeting.title} のご案内`,
                html
            });

            if (result.success) {
                sentCount++;
            } else {
                errors.push(`${officer.name}: ${result.error}`);
            }
        } catch (e: any) {
            errors.push(`${officer.name}: ${e.message}`);
        }
    }

    // Log Audit
    if (sentCount > 0) {
        await logAudit('MEETING_UPDATE', `Sent convocation emails to ${sentCount} officers for ${meeting.title}`, 'INFO');
    }

    return {
        success: sentCount > 0,
        sentCount,
        errors: errors.length > 0 ? errors : undefined
    };
}
