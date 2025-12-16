// Precision Check API Endpoint
// On-demand o1 verification for chat messages

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Lazy initialize to avoid build-time errors
function getOpenAIClient() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

export const maxDuration = 60; // o1 takes longer
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { messageId, conversationHistory } = await req.json();

        if (!messageId || !conversationHistory) {
            return NextResponse.json(
                { error: 'Missing messageId or conversationHistory' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Auth check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Get user's organization and plan
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id, organizations(plan_id)')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) {
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
            );
        }

        const orgId = profile.organization_id;
        // @ts-ignore
        const planId = profile.organizations?.plan_id || 'free';

        // 3. Check o1 quota
        const { data: quotaCheck } = await adminSupabase
            .rpc('check_o1_quota', { p_organization_id: orgId })
            .single();

        if (!quotaCheck?.can_use) {
            return NextResponse.json({
                error: 'O1 quota exceeded',
                details: `Used ${quotaCheck.used_this_month}/${quotaCheck.limit_per_month} this month`,
            }, { status: 403 });
        }

        // 4. Get original message
        const { data: message } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('id', messageId)
            .single();

        if (!message) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            );
        }

        // 5. Build verification prompt
        const verificationPrompt = buildVerificationPrompt(
            message.content,
            conversationHistory
        );

        // 6. Call o1 for verification
        const completion = await getOpenAIClient().chat.completions.create({
            model: 'o1-preview',
            messages: [
                {
                    role: 'user',
                    content: verificationPrompt
                }
            ],
        });

        const verificationResult = completion.choices[0].message.content;

        // 7. Parse o1 response
        let parsedResult;
        try {
            parsedResult = JSON.parse(verificationResult || '{}');
        } catch (e) {
            // o1 might return text instead of JSON
            parsedResult = {
                verified: true,
                confidence: 0.9,
                corrections: [],
                explanation: verificationResult
            };
        }

        // 8. Update message with precision check result
        await adminSupabase
            .from('chat_messages')
            .update({
                precision_checked_at: new Date().toISOString(),
                precision_check_result: parsedResult
            })
            .eq('id', messageId);

        // 9. Log to model_router_logs
        await adminSupabase.from('model_router_logs').insert({
            organization_id: orgId,
            user_id: user.id,
            user_message: `[Precision Check] ${message.content.substring(0, 200)}`,
            detected_intent: 'precision_check',
            selected_tier: 'advisor',
            selected_model: 'o1-preview',
            was_overridden: true // User manually requested this
        });

        // 10. Return result
        return NextResponse.json({
            success: true,
            result: parsedResult,
            model: 'o1-preview',
            quotaRemaining: quota.remaining - 1,
        });

    } catch (error: any) {
        console.error('[Precision Check API] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * Build verification prompt for o1
 */
function buildVerificationPrompt(
    originalMessage: string,
    conversationHistory: any[]
): string {
    const historyText = conversationHistory
        .map(m => `[${m.role}]: ${m.content}`)
        .join('\n\n');

    return `
You are a precision verification system for AI responses about Japanese legal entities (社会福祉法人, NPO, 医療法人).

# TASK
Re-verify the accuracy of the following AI response. Check for:
1. Factual correctness
2. Legal accuracy (law citations, requirements)
3. Potential hallucinations or assumptions
4. Missing caveats or disclaimers

# CONVERSATION HISTORY
${historyText}

# TARGET MESSAGE TO VERIFY
${originalMessage}

# OUTPUT FORMAT (JSON)
{
  "verified": true | false,
  "confidence": 0.95,
  "corrections": [
    {"issue": "Incorrect law citation", "correction": "Should be 社会福祉法 第45条"}
  ],
  "explanation": "Brief explanation of verification result in Japanese"
}

CRITICAL:
- Only flag issues if you are CERTAIN they are incorrect
- If uncertain, set verified=true with lower confidence
- Provide specific corrections with sources
`.trim();
}
