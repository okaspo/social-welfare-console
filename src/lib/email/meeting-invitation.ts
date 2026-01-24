/**
 * Meeting Invitation Email Service
 * 理事会出席確認メールの送信と管理
 */

import { Resend } from 'resend';
import { prisma } from '@/lib/db/prisma';
import { randomBytes } from 'crypto';

// Resendクライアント取得
const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY || 're_dummy_for_build';
    return new Resend(apiKey);
};

// ============================================================================
// 型定義
// ============================================================================

export interface SendInvitationParams {
    meetingId: string;
    officerId: string;
    email: string;
    officerName: string;
    meetingTitle: string;
    meetingDate: Date;
    meetingType: string;
}

export interface SendInvitationResult {
    success: boolean;
    invitationId?: string;
    emailLogId?: string;
    error?: string;
}

export interface BulkSendResult {
    total: number;
    sent: number;
    failed: number;
    results: SendInvitationResult[];
}

// ============================================================================
// ユニークトークン生成
// ============================================================================

function generateToken(): string {
    return randomBytes(32).toString('hex');
}

// ============================================================================
// メールテンプレート
// ============================================================================

function generateInvitationEmailHtml(params: {
    officerName: string;
    meetingTitle: string;
    meetingDate: Date;
    meetingType: string;
    token: string;
}): string {
    const { officerName, meetingTitle, meetingDate, meetingType, token } = params;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';
    const formattedDate = meetingDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });

    const attendUrl = `${baseUrl}/api/rsvp/${token}?response=attending`;
    const absentUrl = `${baseUrl}/api/rsvp/${token}?response=absent`;
    const proxyUrl = `${baseUrl}/rsvp/${token}/proxy`;

    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>出席確認のお願い</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #4e54c8; padding-bottom: 10px;">
            📋 出席確認のお願い
        </h1>
        
        <p style="color: #333; font-size: 16px; line-height: 1.8;">
            ${officerName} 様
        </p>
        
        <p style="color: #333; font-size: 16px; line-height: 1.8;">
            下記の会議への出欠をお知らせください。
        </p>
        
        <div style="background-color: #f8f9fa; border-left: 4px solid #4e54c8; padding: 15px 20px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #555;">
                <strong>会議名:</strong> ${meetingTitle}
            </p>
            <p style="margin: 5px 0; color: #555;">
                <strong>種別:</strong> ${meetingType}
            </p>
            <p style="margin: 5px 0; color: #555;">
                <strong>日時:</strong> ${formattedDate}
            </p>
        </div>
        
        <p style="color: #333; font-size: 16px; line-height: 1.8; margin-top: 30px;">
            以下のボタンをクリックして回答してください:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${attendUrl}" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">
                ✅ 出席する
            </a>
            <a href="${absentUrl}" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">
                ❌ 欠席する
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center;">
            <a href="${proxyUrl}" style="color: #4e54c8;">委任状を提出する場合はこちら</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
            このメールは社会福祉法人業務支援システムから自動送信されています。<br>
            ご不明な点がございましたら、事務局までお問い合わせください。
        </p>
    </div>
</body>
</html>
    `.trim();
}

// ============================================================================
// 単一送信
// ============================================================================

export async function sendMeetingInvitation(
    params: SendInvitationParams
): Promise<SendInvitationResult> {
    const { meetingId, officerId, email, officerName, meetingTitle, meetingDate, meetingType } = params;

    // 1. トークン生成
    const token = generateToken();

    // 2. メール送信
    let emailLogId: string | undefined;
    let resendId: string | undefined;
    let emailStatus: 'sent' | 'failed' | 'simulated' = 'failed';
    let errorMessage: string | undefined;

    try {
        if (!process.env.RESEND_API_KEY) {
            // 開発環境: シミュレート
            console.log(`[MeetingInvitation] Simulating email to ${email}`);
            emailStatus = 'simulated';
            resendId = `simulated_${Date.now()}`;
        } else {
            // 本番環境: 実際に送信
            const resend = getResendClient();
            const result = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'GovAI Console <onboarding@resend.dev>',
                to: email,
                subject: `【出欠確認】${meetingTitle}`,
                html: generateInvitationEmailHtml({
                    officerName,
                    meetingTitle,
                    meetingDate,
                    meetingType,
                    token,
                }),
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            resendId = result.data?.id;
            emailStatus = 'sent';
        }
    } catch (error) {
        console.error('[MeetingInvitation] Email send failed:', error);
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        emailStatus = 'failed';
    }

    // 3. メールログ記録
    try {
        const emailLog = await prisma.email_logs.create({
            data: {
                to_email: email,
                subject: `【出欠確認】${meetingTitle}`,
                status: emailStatus,
                resend_id: resendId,
                error_message: errorMessage,
                metadata: {
                    type: 'meeting_invitation',
                    meeting_id: meetingId,
                    officer_id: officerId,
                },
            },
        });
        emailLogId = emailLog.id;
    } catch (error) {
        console.error('[MeetingInvitation] Failed to log email:', error);
    }

    // 4. 招待レコード作成
    if (emailStatus !== 'failed') {
        try {
            const invitation = await prisma.meeting_invitations.create({
                data: {
                    meeting_id: meetingId,
                    officer_id: officerId,
                    email,
                    token,
                    email_log_id: emailLogId,
                },
            });

            return {
                success: true,
                invitationId: invitation.id,
                emailLogId,
            };
        } catch (error) {
            console.error('[MeetingInvitation] Failed to create invitation:', error);
            return {
                success: false,
                emailLogId,
                error: error instanceof Error ? error.message : 'Failed to create invitation',
            };
        }
    }

    return {
        success: false,
        emailLogId,
        error: errorMessage || 'Email send failed',
    };
}

// ============================================================================
// 一括送信（会議に紐づく全役員へ）
// ============================================================================

export async function sendBulkMeetingInvitations(
    meetingId: string
): Promise<BulkSendResult> {
    // 1. 会議情報取得
    const meeting = await prisma.meetings.findUnique({
        where: { id: meetingId },
        include: {
            profiles: {
                include: {
                    organizations: true,
                },
            },
        },
    });

    if (!meeting) {
        throw new Error('Meeting not found');
    }

    // 2. 組織の役員取得（メールアドレス付き）
    // 注: 現在のスキーマではofficersにemailがないため、profilesから取得する必要がある
    const organizationId = meeting.profiles?.organization_id;
    if (!organizationId) {
        throw new Error('Organization not found for this meeting');
    }

    const officers = await prisma.officers.findMany({
        where: {
            profiles: {
                organization_id: organizationId,
            },
        },
        include: {
            profiles: true,
        },
    });

    // 3. 既存の招待を確認（重複防止）
    const existingInvitations = await prisma.meeting_invitations.findMany({
        where: { meeting_id: meetingId },
        select: { officer_id: true },
    });
    const invitedOfficerIds = new Set(existingInvitations.map(i => i.officer_id));

    // 4. 未招待の役員に送信
    const results: SendInvitationResult[] = [];

    for (const officer of officers) {
        if (invitedOfficerIds.has(officer.id)) {
            continue; // 既に招待済み
        }

        // メールアドレスを取得（profilesからauth.usersを経由する必要がある場合がある）
        // ここでは簡易的にprofilesのIDからusersのemailを取得する想定
        // 実際の実装ではauth.usersへのアクセス方法に依存
        const email = officer.profiles?.id
            ? await getOfficerEmail(officer.profiles.id)
            : null;

        if (!email) {
            results.push({
                success: false,
                error: `Email not found for officer: ${officer.name}`,
            });
            continue;
        }

        const result = await sendMeetingInvitation({
            meetingId,
            officerId: officer.id,
            email,
            officerName: officer.name,
            meetingTitle: meeting.title,
            meetingDate: meeting.date,
            meetingType: meeting.type,
        });

        results.push(result);
    }

    return {
        total: results.length,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
    };
}

// ============================================================================
// ヘルパー: ユーザーメール取得
// ============================================================================

async function getOfficerEmail(profileId: string): Promise<string | null> {
    // profileIdはauth.usersのidと同じ
    // Prismaではauth.usersからemailを直接取得
    try {
        const user = await prisma.users.findUnique({
            where: { id: profileId },
            select: { email: true },
        });
        return user?.email || null;
    } catch {
        return null;
    }
}

// ============================================================================
// 回答処理
// ============================================================================

export async function respondToInvitation(
    token: string,
    response: 'attending' | 'absent' | 'proxy',
    proxyName?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const invitation = await prisma.meeting_invitations.findUnique({
            where: { token },
        });

        if (!invitation) {
            return { success: false, error: 'Invalid or expired invitation token' };
        }

        if (invitation.responded_at) {
            return { success: false, error: 'Already responded to this invitation' };
        }

        await prisma.meeting_invitations.update({
            where: { token },
            data: {
                response,
                proxy_name: response === 'proxy' ? proxyName : null,
                responded_at: new Date(),
            },
        });

        // attendance_recordsにも反映
        const statusMap = {
            attending: 'attending',
            absent: 'absent',
            proxy: 'proxy',
        };

        await prisma.attendance_records.upsert({
            where: {
                meeting_id_officer_id: {
                    meeting_id: invitation.meeting_id,
                    officer_id: invitation.officer_id,
                },
            },
            create: {
                meeting_id: invitation.meeting_id,
                officer_id: invitation.officer_id,
                status: statusMap[response],
                is_signed: response === 'attending',
            },
            update: {
                status: statusMap[response],
                is_signed: response === 'attending',
            },
        });

        return { success: true };
    } catch (error) {
        console.error('[MeetingInvitation] Response failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
