import { createClient } from '@/lib/supabase/server';
import { Shield, Download, Filter, Clock, User, FileText } from 'lucide-react';
import AuditLogExport from './audit-log-export';

interface AuditLog {
    id: string;
    action: string;
    target_resource: string;
    target_id: string | null;
    actor_id: string;
    ip_address: string | null;
    user_agent: string | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    actor?: {
        full_name: string;
        email: string;
    };
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    login: { label: 'ログイン', color: 'bg-green-100 text-green-800' },
    logout: { label: 'ログアウト', color: 'bg-gray-100 text-gray-800' },
    download_document: { label: 'ドキュメント閲覧', color: 'bg-blue-100 text-blue-800' },
    update_officer: { label: '役員情報更新', color: 'bg-yellow-100 text-yellow-800' },
    create_meeting: { label: '会議作成', color: 'bg-indigo-100 text-indigo-800' },
    send_consent: { label: '同意依頼送信', color: 'bg-purple-100 text-purple-800' },
    consent_responded: { label: '同意回答', color: 'bg-emerald-100 text-emerald-800' },
    generate_minutes: { label: '議事録生成', color: 'bg-cyan-100 text-cyan-800' },
};

export default async function AuditLogsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Unauthorized</div>;

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'representative')) {
        return <div className="p-8 text-red-600">管理者権限が必要です</div>;
    }

    // Fetch audit logs
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select(`
            *,
            actor:profiles!audit_logs_actor_id_fkey (
                full_name
            )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching audit logs:', error);
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-6 w-6 text-indigo-600" />
                        セキュリティ監査ログ
                    </h1>
                    <p className="text-gray-500 mt-1">
                        システムの操作履歴を確認できます。最新100件を表示しています。
                    </p>
                </div>
                <AuditLogExport />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">{logs?.length || 0}</div>
                    <div className="text-sm text-gray-500">表示中のログ</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-2xl font-bold text-green-600">
                        {logs?.filter(l => l.action === 'login').length || 0}
                    </div>
                    <div className="text-sm text-gray-500">ログイン</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">
                        {logs?.filter(l => l.action === 'download_document').length || 0}
                    </div>
                    <div className="text-sm text-gray-500">ドキュメント閲覧</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="text-2xl font-bold text-yellow-600">
                        {logs?.filter(l => l.action === 'update_officer').length || 0}
                    </div>
                    <div className="text-sm text-gray-500">更新操作</div>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">日時</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">アクション</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">ユーザー</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">対象リソース</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600">IPアドレス</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs?.map((log: AuditLog) => {
                                const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-800' };
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionInfo.color}`}>
                                                {actionInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">
                                            {(log.actor as { full_name?: string })?.full_name || log.actor_id.slice(0, 8)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {log.target_resource}
                                            {log.target_id && <span className="text-gray-400 text-xs ml-1">({log.target_id.slice(0, 8)})</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                            {log.ip_address || '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {(!logs || logs.length === 0) && (
                        <div className="p-12 text-center text-gray-500">
                            監査ログはまだありません
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
