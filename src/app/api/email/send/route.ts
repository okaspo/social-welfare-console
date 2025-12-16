import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { subject, content, to } = body;

        // Simple validation
        if (!subject || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // For this prototype, we default 'to' to the logged-in user's email if not specified,
        // or allow sending to specific addresses if implemented.
        const recipient = to || user.email;

        // Formatting content
        const html = `
            <div style="font-family: serif; white-space: pre-wrap; color: #333;">
                ${content.replace(/\n/g, '<br/>')}
            </div>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Sent via GovAI Social Welfare Console
            </p>
        `;

        const result = await sendEmail({
            to: recipient,
            subject: subject,
            html: html
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data });

    } catch (error) {
        console.error('Email API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
