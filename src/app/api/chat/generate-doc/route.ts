import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = await streamText({
        model: openai('gpt-4o'),
        messages: [
            {
                role: 'system',
                content: 'You are an advanced legal AI assistant specialized in Japanese Social Welfare Corporation Law. Output ONLY the requested document text without conversational filler.'
            },
            ...messages
        ],
        temperature: 0.3,
    });

    return result.toTextStreamResponse();
}
