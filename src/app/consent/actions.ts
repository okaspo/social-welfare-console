'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export type ConsentVerificationResult = {
    valid: boolean;
    meeting?: {
        title: string;
        date: string;
        place: string;
        content: string;
    };
    consent?: {
        officer_name: string;
        status: string;
    };
    error?: string;
};

export async function verifyConsentToken(token: string): Promise<ConsentVerificationResult> {
    const supabase = await createClient();

    // Fetch consent record with related meeting and officer info
    const { data: consent, error } = await supabase
        .from('meeting_consents')
        .select(`
            *,
            meeting:meetings (
                title,
                date,
                place,
                content
            ),
            officer:officers (
                name
            )
        `)
        .eq('token', token)
        .single();

    if (error || !consent) {
        return { valid: false, error: 'Invalid or expired token.' };
    }

    // Check expiration
    if (new Date(consent.token_expires_at) < new Date()) {
        return { valid: false, error: 'This link has expired.' };
    }

    return {
        valid: true,
        meeting: {
            title: consent.meeting.title,
            date: consent.meeting.date,
            place: consent.meeting.place,
            content: consent.meeting.content
        },
        consent: {
            officer_name: consent.officer.name,
            status: consent.status
        }
    };
}

export async function submitConsent(token: string, agreed: boolean) {
    const supabase = await createClient();

    // Security: Get IP and User Agent
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const status = agreed ? 'agreed' : 'rejected';

    const { error } = await supabase
        .from('meeting_consents')
        .update({
            status,
            responded_at: new Date().toISOString(),
            ip_address: ip,
            user_agent: userAgent
        })
        .eq('token', token);

    if (error) {
        console.error('Consent submission error:', error);
        throw new Error('Failed to submit consent.');
    }

    return { success: true };
}
