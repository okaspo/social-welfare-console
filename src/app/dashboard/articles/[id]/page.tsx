'use client'

import React from 'react'
import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft, Clock, Printer } from 'lucide-react'
import { MOCK_ARTICLES, ARTICLE_CATEGORIES } from '@/lib/articles/data'

export default function ArticleViewerPage() {
    const params = useParams()
    const docId = params.id as string
    const doc = MOCK_ARTICLES.find(a => a.id === docId)

    if (!doc) {
        return notFound()
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Navigation & Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard/articles"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    一覧に戻る
                </Link>

                <div className="bg-white border border-gray-100 rounded-lg p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-6 mb-8">
                        <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mb-2">
                                {ARTICLE_CATEGORIES[doc.category]}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                                {doc.title}
                            </h1>
                            <div className="flex items-center text-sm text-gray-400 mt-2">
                                <Clock className="h-4 w-4 mr-1" />
                                最終改定: {doc.lastUpdated}
                            </div>
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                        >
                            <Printer className="h-4 w-4" />
                            印刷
                        </button>
                    </div>

                    {/* Markdown Viewer */}
                    <article className="prose prose-slate prose-sm md:prose-base max-w-none">
                        <ReactMarkdown>
                            {doc.content}
                        </ReactMarkdown>
                    </article>
                </div>
            </div>
        </div>
    )
}
