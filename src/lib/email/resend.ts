import { Resend } from 'resend';

// Use environment variable or fallback for development/build
// In production runtime, RESEND_API_KEY must be set
const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY || 're_dummy_for_build';
    return new Resend(apiKey);
};

export type SendEmailParams = {
    to: string | string[];
    subject: string;
    html: string;
    from?: string; // Optional custom sender
};

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Email sending simulated.');
        // In local dev without key, simulate success
        if (process.env.NODE_ENV !== 'production') {
            return { success: true, data: { id: 'simulated_email_id' } };
        }
        return { success: false, error: 'Configuration error: Missing API Key' };
    }

    try {
        const resend = getResendClient();
        const data = await resend.emails.send({
            from: from || 'GovAI Console <onboarding@resend.dev>', // Default sender
            to,
            subject,
            html,
        });

        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}
