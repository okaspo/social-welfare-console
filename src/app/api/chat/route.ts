import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { JUDICIAL_SCRIVENER_PROMPT, MOCK_KNOWLEDGE_BASE } from '@/lib/chat/system-prompt';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = await streamText({
        model: openai('gpt-4o'),
        system: `${JUDICIAL_SCRIVENER_PROMPT}\n\n【知識ファイル（法人固有情報）Mock】\n${JSON.stringify(MOCK_KNOWLEDGE_BASE, null, 2)}`,
        messages,
    });

    return result.toTextStreamResponse();
}
