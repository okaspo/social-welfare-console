import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { JUDICIAL_SCRIVENER_PROMPT, MOCK_KNOWLEDGE_BASE } from '@/lib/chat/system-prompt';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    // 1. Try to fetch active prompt from DB
    let systemPrompt = JUDICIAL_SCRIVENER_PROMPT

    // Check if we have credentials to fetch from DB
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
        try {
            // Fetch prompt from Supabase REST API directly to avoid cookie/server client complexity in this route type for now
            // or just use createClient from @supabase/supabase-js
            const { createClient } = require('@supabase/supabase-js')
            const supabase = createClient(supabaseUrl, supabaseKey)

            const { data, error } = await supabase
                .from('system_prompts')
                .select('content')
                .eq('name', 'default')
                .maybeSingle()

            if (data?.content) {
                systemPrompt = data.content
            }
        } catch (e) {
            console.warn("Failed to fetch dynamic prompt, using default.", e)
        }
    }

    const result = await streamText({
        model: openai('gpt-4o'),
        system: `${systemPrompt}\n\n【知識ファイル（法人固有情報）Mock】\n${JSON.stringify(MOCK_KNOWLEDGE_BASE, null, 2)}`,
        messages,
    });

    return result.toTextStreamResponse();
}
