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

            revalidatePath(`/dashboard/meetings/${meetingId}`);
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

    revalidatePath(`/dashboard/meetings/${meetingId}`);
    return token;
}

export async function sendConvocationNotice(meetingId: string) {
    // Placeholder for email sending logic (Resend/SendGrid)
    // This would iterate over all officers, generate tokens, and send emails
    console.log('Sending convocation notices for meeting:', meetingId);
    return { success: true };
}
