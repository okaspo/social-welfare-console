import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const { messages, systemPrompt } = await req.json()

        const result = streamText({
            model: openai('gpt-4o-mini'),
            messages,
            system: systemPrompt || 'You are a helpful assistant.',
        })

        return result.toTextStreamResponse()
    } catch (error: any) {
        console.error('Test API Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
}
