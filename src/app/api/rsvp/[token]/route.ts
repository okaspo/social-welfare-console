/**
 * RSVP API - 出席確認ワンクリック回答エンドポイント
 * GET /api/rsvp/[token]?response=attending|absent
 */

import { NextRequest, NextResponse } from 'next/server';
import { respondToInvitation } from '@/lib/email/meeting-invitation';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const searchParams = request.nextUrl.searchParams;
        const response = searchParams.get('response') as 'attending' | 'absent' | null;

        if (!token) {
            return NextResponse.redirect(
                new URL('/rsvp/error?reason=invalid_token', request.url)
            );
        }

        if (!response || !['attending', 'absent'].includes(response)) {
            return NextResponse.redirect(
                new URL('/rsvp/error?reason=invalid_response', request.url)
            );
        }

        const result = await respondToInvitation(token, response);

        if (!result.success) {
            const reason = result.error?.includes('Already')
                ? 'already_responded'
                : 'invalid_token';
            return NextResponse.redirect(
                new URL(`/rsvp/error?reason=${reason}`, request.url)
            );
        }

        // 成功ページへリダイレクト
        return NextResponse.redirect(
            new URL(`/rsvp/success?response=${response}`, request.url)
        );
    } catch (error) {
        console.error('[RSVP API] Error:', error);
        return NextResponse.redirect(
            new URL('/rsvp/error?reason=server_error', request.url)
        );
    }
}
