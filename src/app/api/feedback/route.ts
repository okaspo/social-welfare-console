/**
 * Feedback API - フィードバック送信エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { type, content, organizationId } = body;

        if (!type || !content) {
            return NextResponse.json(
                { error: 'Type and content are required' },
                { status: 400 }
            );
        }

        // Get user's organization if not provided
        let orgId = organizationId;
        if (!orgId) {
            const profile = await prisma.profiles.findUnique({
                where: { id: user.id },
                select: { organization_id: true },
            });
            orgId = profile?.organization_id;
        }

        const feedback = await prisma.feedbacks.create({
            data: {
                user_id: user.id,
                organization_id: orgId,
                type,
                content,
                status: 'open',
            },
        });

        return NextResponse.json({ success: true, id: feedback.id });
    } catch (error) {
        console.error('[Feedback API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to submit feedback' },
            { status: 500 }
        );
    }
}
