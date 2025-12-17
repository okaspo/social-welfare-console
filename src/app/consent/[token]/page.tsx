import { verifyConsentToken, submitConsent } from '../actions';
import { CheckCircle2, XCircle, AlertCircle, FileText, MapPin, Calendar, Lock } from 'lucide-react';
import { notFound } from 'next/navigation';

// Client component for the form interaction
import ConsentForm from './consent-form';

export default async function ConsentPage({ params }: { params: { token: string } }) {
    const { token } = await params;

    const result = await verifyConsentToken(token);

    if (!result.valid) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-lg text-center">
                    <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">リンクが無効です</h1>
                    <p className="text-gray-500 mb-6">{result.error || 'このリンクは期限切れか、既に無効になっています。事務局にお問い合わせください。'}</p>
                </div>
            </div>
        );
    }

    const { meeting, consent } = result;

    if (!meeting || !consent) return notFound();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">

            <div className="mb-8 text-center text-gray-400 text-sm flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>S級AI事務局 葵さんによるセキュアな同意システム</span>
            </div>

            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="bg-slate-900 text-white p-8">
                    <div className="inline-block px-3 py-1 bg-slate-800 rounded-full text-xs font-medium mb-4 text-emerald-400 border border-slate-700">
                        みなし決議（書面決議）
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">
                        {meeting.title}
                    </h1>
                    <p className="text-slate-400">
                        {consent.officer_name} 様への同意依頼
                    </p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">

                    {/* Meeting Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
                                <Calendar className="h-4 w-4" />
                                開催予定日
                            </div>
                            <div className="text-gray-900 font-semibold">{meeting.date}</div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
                                <MapPin className="h-4 w-4" />
                                場所
                            </div>
                            <div className="text-gray-900 font-semibold">{meeting.place}</div>
                        </div>
                    </div>

                    {/* Proposal Content */}
                    <div className="prose prose-slate max-w-none">
                        <h3 className="flex items-center gap-2 font-bold text-gray-900 border-b pb-2 mb-4">
                            <FileText className="h-5 w-5 text-indigo-600" />
                            提案事項
                        </h3>
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-white text-base">
                            {meeting.content}
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="border-t pt-8">
                        <ConsentForm
                            token={token}
                            initialStatus={consent.status}
                            officerName={consent.officer_name}
                        />
                    </div>

                </div>
            </div>

            <p className="mt-8 text-center text-gray-400 text-xs">
                © Social Welfare AI Console. All rights reserved.<br />
                IP Address and Timestamp will be recorded for audit purposes.
            </p>
        </div>
    );
}
