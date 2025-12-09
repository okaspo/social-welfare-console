import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@supabase/supabase-js';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, systemPrompt } = await req.json();

    // Verify Admin/Auth (Simplified for this route, relying on Middleware protection for /admin routes usually, 
    // but good to check role if possible. Here we assume the frontend protected this.)

    // We strictly use the PASSED systemPrompt, avoiding DB fetch for the "active" one.
    // This allows testing strictly what is in the editor.

    if (!systemPrompt) {
        return new Response('System prompt is required for testing', { status: 400 });
    }

    // Mock Knowledge injection for context if needed, or keep it raw?
    // User requested "Common Knowledge", we should probably inject it here too if we want a realistic test?
    // For now, let's inject a placeholder or fetch it if we want "Full Fidelity" testing.
    // Let's fetch it to be safe so the playground matches production behavior.

    let commonKnowledge = ""
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
        try {
            const supabase = createClient(supabaseUrl, supabaseKey)
            const { data: knowledgeData } = await supabase
                .from('knowledge_items')
                .select('title, content, category')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(20)

            if (knowledgeData && knowledgeData.length > 0) {
                commonKnowledge = knowledgeData.map(item => {
                    return `### ${item.title} (${item.category})\n${item.content}`
                }).join('\n\n')
            }
        } catch (e) {
            console.warn("Failed to fetch knowledge for test", e)
        }
    }

    const finalSystemMessage = `
${systemPrompt}

【共通知識ライブラリ (Markdown) [TEST MODE]】
${commonKnowledge || '(現在、共通知識はありません)'}
`

    const result = await streamText({
        model: openai('gpt-4o'),
        system: finalSystemMessage,
        messages,
    });

    return result.toTextStreamResponse();
}
