import { createAdminClient } from '@/lib/supabase/admin'
import { Activity, ShieldAlert } from 'lucide-react'

export default async function AuditPage() {
    const supabase = await createAdminClient()

    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)

    if (error) {
        console.error('Error fetching audit logs:', error)
        return <div className="p-8 text-red-600">Error loading logs</div>
    }

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-indigo-600" />
                        監査ログ (Audit Master)
                    </h1>
                    <p className="text-gray-500 mt-1">システム内の重要な操作履歴を閲覧します (直近100件)</p>
                </div>
            </div>

            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3">日時</th>
                            <th className="px-6 py-3">アクション</th>
                            <th className="px-6 py-3">組織ID</th>
                            <th className="px-6 py-3">ユーザーID</th>
                            <th className="px-6 py-3">詳細</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs?.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    ログはまだありません
                                </td>
                            </tr>
                        ) : (
                            logs?.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${log.action.includes('error') || log.action.includes('delete') || log.action === 'ADMIN_PLAN_OVERRIDE'
                                                ? 'bg-red-50 text-red-700 border-red-100'
                                                : 'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                        {log.organization_id || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                        {log.user_id || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={JSON.stringify(log.details, null, 2)}>
                                        {log.details ? JSON.stringify(log.details) : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
