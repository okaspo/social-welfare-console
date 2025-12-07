'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, ChevronRight, Search } from 'lucide-react'
import { MOCK_ARTICLES, ARTICLE_CATEGORIES, ArticleCategory } from '@/lib/articles/data'
import { PricingPlan, canAccess } from '@/lib/auth/access-control'
import clsx from 'clsx'

// Mock Plan
const CURRENT_PLAN: PricingPlan = 'STANDARD'

export default function ArticlesPage() {
    const [search, setSearch] = useState('')
    const canSearch = canAccess(CURRENT_PLAN, 'archive_search')

    const filteredArticles = MOCK_ARTICLES.filter(doc =>
        doc.title.includes(search)
    )

    // Group by Category
    const groupedArticles = (Object.keys(ARTICLE_CATEGORIES) as ArticleCategory[]).reduce((acc, category) => {
        acc[category] = filteredArticles.filter(doc => doc.category === category)
        return acc
    }, {} as Record<ArticleCategory, typeof MOCK_ARTICLES>)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">定款・諸規程</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        法人の定款及び業務執行に関する規程類一覧。
                    </p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={canSearch ? "規程を検索..." : "検索はスタンダードプラン以上"}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        disabled={!canSearch}
                        className={clsx(
                            "w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2",
                            canSearch
                                ? "bg-white border-gray-200 focus:ring-gray-900"
                                : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                        )}
                    />
                    {!canSearch && (
                        <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                            🔒
                        </div>
                    )}
                </div>
            </div>

            {/* Lists by Category */}
            <div className="grid gap-8">
                {(Object.entries(ARTICLE_CATEGORIES) as [ArticleCategory, string][]).map(([category, label]) => {
                    const articles = groupedArticles[category]
                    if (articles.length === 0) return null

                    return (
                        <div key={category}>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="w-1 h-6 bg-gray-900 rounded-full"></span>
                                {label}
                            </h2>
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {articles.map((doc) => (
                                    <Link
                                        key={doc.id}
                                        href={`/dashboard/articles/${doc.id}`}
                                        className="group p-4 bg-white border border-gray-100 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all flex items-start justify-between"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-gray-50 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <FileText className="h-5 w-5 text-gray-500 group-hover:text-gray-900" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                    {doc.title}
                                                </h3>
                                                <p className="text-xs text-gray-400 mt-1">最終更新: {doc.lastUpdated}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 group-hover:text-gray-500 transition-all opacity-0 group-hover:opacity-100" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {filteredArticles.length === 0 && (
                    <div className="py-12 text-center text-gray-400">
                        該当する規程は見つかりませんでした。
                    </div>
                )}
            </div>
        </div>
    )
}
