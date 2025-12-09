'use client'

import { useState } from 'react'
import { Search, MoreVertical, CheckCircle, XCircle } from 'lucide-react'

type UserData = {
    id: string
    full_name: string | null
    email?: string
    role: string
    organization: {
        name: string
        plan: string
    } | null
    created_at: string
}

export default function UserList({ initialUsers }: { initialUsers: UserData[] }) {
    const [search, setSearch] = useState('')

    const filteredUsers = initialUsers.filter(u =>
        (u.full_name || '').includes(search) ||
        (u.organization?.name || '').includes(search)
    )

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="名前、法人名で検索..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-3 w-12"></th>
                        <th className="px-6 py-3">氏名</th>
                        <th className="px-6 py-3">法人名</th>
                        <th className="px-6 py-3">プラン</th>
                        <th className="px-6 py-3">登録日</th>
                        <th className="px-6 py-3 text-right">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                    {(user.full_name || '?')[0]}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{user.full_name || '未設定'}</div>
                                <div className="mt-1">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin' || user.role === 'ADMIN'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                                {user.organization?.name || '未所属'}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${user.organization?.plan === 'PRO' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                    user.organization?.plan === 'STANDARD' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        user.organization?.plan === 'ENTERPRISE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                    {user.organization?.plan || 'FREE'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-xs">
                                {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {filteredUsers.length === 0 && (
                <div className="p-12 text-center text-gray-400 text-sm">
                    該当するユーザーは見つかりませんでした。
                </div>
            )}
        </div>
    )
}
