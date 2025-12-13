import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt } from '@/lib/prompt-builder'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
    }

    try {
        const prompt = await buildSystemPrompt(userId)
        return NextResponse.json({ prompt })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
