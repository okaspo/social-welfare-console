import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { checkUsage, incrementUsage } from '@/lib/usage-guard';
import { buildSystemPrompt } from '@/lib/prompt-builder';
import { PlanType } from '@/lib/types';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    // 2. Initial Setup
    const { messages } = await req.json();

    // Fetch Org & Plan
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) {
        return new Response('Organization not found', { status: 400 });
    }

    const { data: org } = await supabase
        .from('organizations')
        .select('plan_id')
        .eq('id', profile.organization_id)
        .single();

    const planId = (org?.plan_id || 'free') as PlanType;

    // 3. Check Quota
    // Note: We check if they can send *1* more message.
    try {
        await checkUsage(profile.organization_id, planId, 'chat_message', 1);
    } catch (e: any) {
        // Return 403 with friendly message in body or a specific error code
        return new Response(JSON.stringify({ error: e.message, type: 'QUOTA_EXCEEDED' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // 4. Increment Usage
    // We increment AT START to prevent abuse / race condition exploits partially.
    await incrementUsage(profile.organization_id, 'chat');

    // 5. Build System Prompt
    const systemPrompt = await buildSystemPrompt(planId);

    // 6. Streaming Response
    const result = streamText({
        model: openai('gpt-4o'), // Or appropriate model. Verify env var OPENAI_API_KEY is present.
        system: systemPrompt,
        messages,
    });

    return result.toTextStreamResponse();
}
