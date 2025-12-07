
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MOCK_ARTICLES, ARTICLE_CATEGORIES } from '@/lib/articles/data';
import { MarkdownViewer } from '@/components/articles/markdown-viewer';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';

interface ArticlePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const { id } = await params;
    const article = MOCK_ARTICLES.find(a => a.id === id);

    if (!article) {
        notFound();
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Link
                href="/articles"
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-1" />
                一覧に戻る
            </Link>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 px-8 py-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900 text-white">
                            {ARTICLE_CATEGORIES[article.category]}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                        {article.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            最終更新: {article.lastUpdated}
                        </div>
                        <div className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            ID: {article.id}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 md:p-12">
                    <MarkdownViewer content={article.content} />
                </div>
            </div>
        </div>
    );
}
