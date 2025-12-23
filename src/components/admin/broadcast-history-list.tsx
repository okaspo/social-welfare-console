import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Mail, CheckCircle, AlertCircle, Users } from 'lucide-react'

type BroadcastHistory = {
    id: string
    created_at: string
    subject: string
    sent_count: number
    target_filter: any
}

export default function BroadcastHistoryList({ history }: { history: BroadcastHistory[] }) {
    if (!history || history.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Mail className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900">配信履歴はありません</h3>
                <p className="text-sm text-gray-500 mt-1">まだ一斉送信は行われていません。</p>
            </div>
        )
    }

    return (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">件名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">対象</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">送信数</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {format(new Date(item.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {item.subject}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                <div className="flex flex-col gap-1">
                                    {item.target_filter?.plan && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                                            Plan: {item.target_filter.plan}
                                        </span>
                                    )}
                                    {item.target_filter?.entity_type && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 w-fit">
                                            Type: {item.target_filter.entity_type}
                                        </span>
                                    )}
                                    {!item.target_filter?.plan && !item.target_filter?.entity_type && (
                                        <span className="text-gray-400 text-xs">全ユーザー</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    {item.sent_count} 名
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
