'use client';

import { useState } from 'react';
import { generateConsentToken, sendConvocationEmails } from '../actions';
import { checkAndGenerateAutoMinutes } from '@/lib/actions/auto-minutes';
import { CheckCircle2, Clock, XCircle, Link as LinkIcon, Copy, RefreshCw, Mail, Send, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

// Type for officer data with consent status
interface OfficerStatus {
    id: string;
    name: string;
    role: string;
    email?: string;
    consent?: {
        token?: string;
        status?: string;
        responded_at?: string;
    };
}

export default function MagicLinkManager({
    meetingId,
    officers
}: {
    meetingId: string,
    officers: OfficerStatus[]
}) {
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isGeneratingMinutes, setIsGeneratingMinutes] = useState(false);

    // Check if all officers have agreed
    const allAgreed = officers.length > 0 && officers.every(o => o.consent?.status === 'agreed');
    const agreedCount = officers.filter(o => o.consent?.status === 'agreed').length;

    const handleGenerateMinutes = async () => {
        setIsGeneratingMinutes(true);
        try {
            const result = await checkAndGenerateAutoMinutes(meetingId);
            if (result.success && result.generated) {
                toast.success('議事録ドラフトを自動生成しました');
            } else if (result.error) {
                toast.error(result.error);
            }
        } catch (e) {
            toast.error('議事録生成に失敗しました');
        } finally {
            setIsGeneratingMinutes(false);
        }
    };

    const handleGenerateLink = async (officerId: string) => {
        // ... (existing logic)
        setGeneratingId(officerId);
        try {
            const token = await generateConsentToken(meetingId, officerId);
            const link = `${window.location.origin}/consent/${token}`;
            await navigator.clipboard.writeText(link);
            toast.success('マジックリンクをコピーしました');
        } catch (e) {
            toast.error('リンク生成に失敗しました');
        } finally {
            setGeneratingId(null);
        }
    };

    const handleSendEmails = async () => {
        if (!confirm('全員に招集通知メールを送信しますか？')) return;
        setIsSending(true);
        try {
            const result = await sendConvocationEmails(meetingId);
            if (result.success) {
                toast.success(`${result.sentCount}件のメールを送信しました`);
            } else {
                if (result.errors) {
                    toast.error(`送信エラー: ${result.errors.join(', ')}`);
                } else {
                    toast.error(result.error || 'メール送信に失敗しました');
                }
            }
        } catch (e) {
            toast.error('予期せぬエラーが発生しました');
        } finally {
            setIsSending(false);
        }
    };

    const getStatusBadge = (status?: string) => {
        // ... (existing logic)
        switch (status) {
            case 'agreed':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="h-3 w-3" /> 同意済</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3" /> 否認</span>;
            case 'viewed':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="h-3 w-3" /> 閲覧済</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><Clock className="h-3 w-3" /> 未回答</span>;
        }
    };

    return (
        <div className="space-y-4">
            {/* Progress and Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                        同意状況: <span className="font-bold text-gray-900">{agreedCount}</span> / {officers.length}
                    </span>
                    {allAgreed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            全員同意済み
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {allAgreed && (
                        <button
                            onClick={handleGenerateMinutes}
                            disabled={isGeneratingMinutes}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
                        >
                            {isGeneratingMinutes ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                            議事録を自動生成
                        </button>
                    )}
                    <button
                        onClick={handleSendEmails}
                        disabled={isSending || allAgreed}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
                    >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        招集通知を一括送信
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto bg-white border border-gray-100 rounded-lg">
                <table className="w-full text-sm text-left">
                    {/* ... existing table content ... */}
                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                        <tr>
                            <th className="px-4 py-3">役職 / 氏名</th>
                            <th className="px-4 py-3">ステータス</th>
                            <th className="px-4 py-3">回答日時</th>
                            <th className="px-4 py-3 text-right">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {officers.map((officer) => (
                            <tr key={officer.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-4">
                                    <div className="font-bold text-gray-900">{officer.name}</div>
                                    <div className="text-xs text-gray-500">{officer.role}</div>
                                </td>
                                <td className="px-4 py-4">
                                    {getStatusBadge(officer.consent?.status)}
                                </td>
                                <td className="px-4 py-4 text-gray-500 font-mono text-xs">
                                    {officer.consent?.responded_at ? new Date(officer.consent.responded_at).toLocaleString('ja-JP') : '-'}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    {officer.consent?.status === 'agreed' ? (
                                        <div className="text-emerald-600 text-xs font-medium flex items-center justify-end gap-1">
                                            <CheckCircle2 className="h-4 w-4" />
                                            完了
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleGenerateLink(officer.id)}
                                            disabled={generatingId === officer.id}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm text-xs font-medium disabled:opacity-50"
                                        >
                                            {generatingId === officer.id ? (
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <LinkIcon className="h-3 w-3" />
                                            )}
                                            {officer.consent?.token ? 'リンク再コピー' : 'リンク生成'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
