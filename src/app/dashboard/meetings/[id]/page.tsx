import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Users, FileText, CheckCircle2, XCircle, Clock, Link as LinkIcon, Send } from 'lucide-react';
import Link from 'next/link';
import MagicLinkManager from './magic-link-manager';

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch Meeting Details
    const { data: meeting, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !meeting) {
        return notFound();
    }

    // Fetch Officers associated with the organization
    // (In a real app, this should be officers assigned to the meeting body, e.g., Board of Directors)
    const { data: officers } = await supabase
        .from('officers')
        .select('*')
        .eq('organization_id', meeting.organization_id)
        .eq('is_active', true);

    // Fetch Existing Consents
    const { data: consents } = await supabase
        .from('meeting_consents')
        .select('*')
        .eq('meeting_id', id);

    // Merge Officers with Consent Status
    const officerStatuses = officers?.map(officer => {
        const consent = consents?.find(c => c.officer_id === officer.id);
        return {
            ...officer,
            consent
        };
    }) || [];

    const isOmission = meeting.meeting_type === 'omission';

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Link href="/dashboard/meetings" className="hover:text-gray-900 transition-colors">会议管理</Link>
                    <span>/</span>
                    <span>詳細</span>
                </div>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
                    {isOmission && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold">
                            みなし決議（書面開催）
                        </span>
                    )}
                </div>
            </div>

            {/* Meeting Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">開催日時</div>
                        <div className="font-semibold text-gray-900">{meeting.date}</div>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">場所</div>
                        <div className="font-semibold text-gray-900">{meeting.place || 'オンライン / 書面'}</div>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        <Users className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">出席対象</div>
                        <div className="font-semibold text-gray-900">理事・監事</div>
                    </div>
                </div>
            </div>

            {/* Content Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    議案 / 報告事項
                </h3>
                <div className="bg-gray-50 rounded-lg p-6 text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                    {meeting.content || '（内容未入力）'}
                </div>
            </div>

            {/* Governance Automation Panel */}
            {isOmission ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Send className="h-5 w-5 text-emerald-400" />
                                同意書収集状況 (Governance Automation)
                            </h3>
                            <p className="text-slate-400 text-xs mt-1">
                                全員の同意が得られると、自動的に議事録が生成されます。
                            </p>
                        </div>
                    </div>

                    <div className="p-6">
                        <MagicLinkManager
                            meetingId={id}
                            officers={officerStatuses}
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
                    <p>この会議は対面開催のため、オンライン同意収集機能は無効です。</p>
                </div>
            )}
        </div>
    );
}
