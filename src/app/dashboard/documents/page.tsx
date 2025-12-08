'use client'

import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'

export default function DocumentsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">書類管理</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        作成した議事録やアップロードされた書類を管理します。
                    </p>
                </div>
                <Link
                    href="/dashboard/documents/new"
                    className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                >
                    <Plus className="h-4 w-4" />
                    議事録を新規作成
                </Link>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-12 text-center text-gray-500">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">書類はまだありません</h3>
                <p className="mt-2 text-sm max-w-sm mx-auto">
                    議事録を作成すると、ここに一覧表示されます。
                </p>
            </div>
        </div>
    )
}
