'use client';

import { useState } from 'react';
import { LogIn, ExternalLink, Clock, MoreHorizontal } from 'lucide-react';
import { EntityTypeBadge } from './entity-filter-tabs';

interface Organization {
    id: string;
    name: string;
    entity_type: string;
    plan: string;
    created_at: string;
    last_login?: string;
    member_count?: number;
}

interface OrganizationListTableProps {
    organizations: Organization[];
    onImpersonate?: (orgId: string) => void;
}

const PLAN_COLORS: Record<string, string> = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
};

export default function OrganizationListTable({ organizations, onImpersonate }: OrganizationListTableProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatLastLogin = (dateStr?: string) => {
        if (!dateStr) return '未ログイン';

        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return '今日';
        if (diffDays === 1) return '昨日';
        if (diffDays < 7) return `${diffDays}日前`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
        return formatDate(dateStr);
    };

    const handleImpersonate = (org: Organization) => {
        if (onImpersonate) {
            onImpersonate(org.id);
        } else {
            // Default: open in new tab with impersonation token
            alert(`代理ログイン機能は実装中です: ${org.name}`);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">法人名</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">種別</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">プラン</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">ユーザー数</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">登録日</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">最終ログイン</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {organizations.map((org) => (
                            <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{org.name}</div>
                                    <div className="text-xs text-gray-400">{org.id.slice(0, 8)}...</div>
                                </td>
                                <td className="px-4 py-3">
                                    <EntityTypeBadge type={org.entity_type} />
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[org.plan] || 'bg-gray-100 text-gray-700'}`}>
                                        {org.plan.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {org.member_count ?? '-'}名
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {formatDate(org.created_at)}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`flex items-center gap-1 text-sm ${org.last_login ? 'text-gray-600' : 'text-gray-400'
                                        }`}>
                                        <Clock className="h-3 w-3" />
                                        {formatLastLogin(org.last_login)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleImpersonate(org)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium hover:bg-indigo-100 transition-colors"
                                            title="代理ログイン"
                                        >
                                            <LogIn className="h-3 w-3" />
                                            代理ログイン
                                        </button>
                                        <a
                                            href={`/admin/customers/${org.id}`}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                                            title="詳細を見る"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {organizations.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        該当する法人はありません
                    </div>
                )}
            </div>
        </div>
    );
}
