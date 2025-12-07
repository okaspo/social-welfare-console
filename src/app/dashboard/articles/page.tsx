
import React from 'react';
import Link from 'next/link';
import { MOCK_ARTICLES, ARTICLE_CATEGORIES } from '@/lib/articles/data';
import { FileText, ChevronRight } from 'lucide-react';

export default function ArticlesPage() {
    const groupedArticles = {
        basic: MOCK_ARTICLES.filter(a => a.category === 'basic'),
        rule: MOCK_ARTICLES.filter(a => a.category === 'rule'),
        manual: MOCK_ARTICLES.filter(a => a.category === 'manual'),
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">定款・諸規程</h1>

            <div className="grid gap-8">
                {(Object.keys(ARTICLE_CATEGORIES) as Array<keyof typeof ARTICLE_CATEGORIES>).map((category) => (
                    <div key={category}>
                        <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-gray-900 pl-3">
                            {ARTICLE_CATEGORIES[category]}
                        </h2>
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <ul className="divide-y divide-gray-100">
                                {groupedArticles[category].map((article) => (
                                    <li key={article.id}>
                                        <Link
                                            href={`/articles/${article.id}`}
                                            className="block hover:bg-gray-50 transition-colors p-4 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-900">{article.title}</p>
                                                    <p className="text-xs text-gray-500">最終更新: {article.lastUpdated}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-gray-300" />
                                        </Link>
                                    </li>
                                ))}
                                {groupedArticles[category].length === 0 && (
                                    <li className="p-4 text-sm text-gray-400 text-center">
                                        文書がありません
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
