'use client';

import { useState } from 'react';
import { generateConsentToken } from '../actions';
import { CheckCircle2, Clock, XCircle, Link as LinkIcon, Copy, RefreshCw, Mail } from 'lucide-react';
import { toast } from 'sonner';

type OfficerStatus = {
    id: string;
    name: string;
    role: string;
    consent?: {
        status: string;
        token: string;
        responded_at?: string;
    };
};

export default function MagicLinkManager({
    meetingId,
    officers
}: {
    meetingId: string,
    officers: OfficerStatus[]
}) {
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    const handleGenerateLink = async (officerId: string) => {
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

    const getStatusBadge = (status?: string) => {
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
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                    <tr>
                        <th className="px-4 py-3 rounded-l-lg">役職 / 氏名</th>
                        <th className="px-4 py-3">ステータス</th>
                        <th className="px-4 py-3">回答日時</th>
                        <th className="px-4 py-3 text-right rounded-r-lg">アクション</th>
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
    );
}
