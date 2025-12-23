'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, ChevronRight, Search, Plus, Calendar } from 'lucide-react'
import { ARTICLE_CATEGORIES, ArticleCategory } from '@/lib/articles/data'
import { PricingPlan, canAccess } from '@/lib/auth/access-control'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import UploadModal from '@/components/articles/upload-modal'

interface Article {
    id: string
    title: string
    category: ArticleCategory
    updated_at: string
    created_at: string
}

export default function ArticleListPage() {
    const [search, setSearch] = useState('')
    const [articles, setArticles] = useState<Article[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPlan, setCurrentPlan] = useState<PricingPlan>('FREE')
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const canSearch = canAccess(currentPlan, 'archive_search')
    const supabase = createClient()

    useEffect(() => {
        const init = async () => {
            setLoading(true)

            // 1. Fetch User Org & Plan
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('organization:organizations(plan)').eq('id', user.id).single()
                if (profile?.organization?.plan) {
                    setCurrentPlan(profile.organization.plan.toUpperCase() as PricingPlan)
                }
            }

            // 2. Fetch Articles
            await fetchArticles()
        }
        init()
    }, [])

    const fetchArticles = async () => {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .order('updated_at', { ascending: false })

        if (data) {
            setArticles(data as unknown as Article[])
        }
        // setLoading(false) // handled in init
        if (!data) setLoading(false) // fallback
    }

    const filteredArticles = articles.filter(doc =>
        doc.title.includes(search)
    )

    // Group by Category
    const groupedArticles = (Object.keys(ARTICLE_CATEGORIES) as ArticleCategory[]).reduce((acc, category) => {
        acc[category] = filteredArticles.filter(doc => doc.category === category)
        return acc
    }, {} as Record<ArticleCategory, Article[]>)

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
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
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
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" />
                        新規登録
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-12 text-center text-gray-400">読み込み中...</div>
            ) : (
                <div className="grid gap-8">
                    {(Object.entries(ARTICLE_CATEGORIES) as [ArticleCategory, string][]).map(([category, label]) => {
                        const categoryArticles = groupedArticles[category] || []
                        if (categoryArticles.length === 0) return null

                        return (
                            <div key={category}>
                                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-gray-900 rounded-full"></span>
                                    {label}
                                </h2>
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {categoryArticles.map((doc) => (
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
                                                        {!doc.organization_id && (
                                                            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                                                                共通
                                                            </span>
                                                        )}
                                                    </h3>

                                                    <div className="flex items-center text-xs text-gray-400 mt-1 gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(doc.updated_at).toLocaleDateString('ja-JP')}
                                                    </div>
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
                        <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            まだ規程が登録されていません。<br />
                            「新規登録」ボタンから登録してください。
                        </div>
                    )}
                </div>
            )}

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => {
                    setIsUploadOpen(false)
                    fetchArticles() // Refresh list on close
                }}
            />
        </div>
    )
}

