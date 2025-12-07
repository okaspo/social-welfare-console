'use client'

import { useState } from 'react'
import { Search, MoreVertical, CheckCircle, XCircle, Shield } from 'lucide-react'

// Mock Data for Admin View
const MOCK_USERS = [
    { id: '1', name: '乾 祐子', corporation: '社会福祉法人 陽だまりの会', email: 'inui@hidamari.or.jp', plan: 'STANDARD', status: 'active', joined: '2025/12/01' },
    { id: '2', name: '久保 潤一郎', corporation: '社会福祉法人 緑風会', email: 'kubo@ryokufu.or.jp', plan: 'PRO', status: 'active', joined: '2025/12/03' },
    { id: '3', name: '山田 太郎', corporation: '社会福祉法人 恵み', email: 'yamada@megumi.com', plan: 'FREE', status: 'inactive', joined: '2025/12/06' },
]

export default function AdminDashboardPage() {
    const [search, setSearch] = useState('')

    const filteredUsers = MOCK_USERS.filter(u =>
        u.name.includes(search) ||
        u.corporation.includes(search) ||
        u.email.includes(search)
    )

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
                    <p className="text-sm text-gray-500 mt-1">登録されている社会福祉法人およびユーザーの一覧</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 border rounded-lg shadow-sm text-center">
                        <span className="block text-xs text-gray-500">総ユーザー</span>
                        <span className="font-bold text-xl">{MOCK_USERS.length}</span>
                    </div>
                    <div className="bg-white px-4 py-2 border rounded-lg shadow-sm text-center">
                        <span className="block text-xs text-gray-500">今月の新規</span>
                        <span className="font-bold text-xl text-green-600">+3</span>
                    </div>
                </div>
            </div>

            {/* User List Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="名前、法人名、メールで検索..."
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
                            <th className="px-6 py-3">氏名 / メール</th>
                            <th className="px-6 py-3">法人名</th>
                            <th className="px-6 py-3">プラン</th>
                            <th className="px-6 py-3">ステータス</th>
                            <th className="px-6 py-3">登録日</th>
                            <th className="px-6 py-3 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                        {user.name[0]}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{user.name}</div>
                                    <div className="text-xs text-gray-400">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {user.corporation}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${user.plan === 'PRO' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                            user.plan === 'STANDARD' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-gray-100 text-gray-600 border-gray-200'
                                        }`}>
                                        {user.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.status === 'active' ? (
                                        <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            有効
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                                            <XCircle className="h-3.5 w-3.5" />
                                            停止中
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {user.joined}
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
        </div>
    )
}
