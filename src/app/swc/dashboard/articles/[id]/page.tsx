'use client'

import React, { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Download, FileText, ExternalLink, History, Plus, FileType, AlignLeft } from 'lucide-react'
import { ARTICLE_CATEGORIES, ArticleCategory } from '@/lib/articles/data'
import { createClient } from '@/lib/supabase/client'
import UploadModal from '@/components/articles/upload-modal'
import ReactMarkdown from 'react-markdown'

interface ArticleDetail {
    id: string
    title: string
    category: ArticleCategory
    updated_at: string
}

interface ArticleVersion {
    id: string
    version_number: number
    effective_date: string
    file_path: string
    changelog: string
    created_at: string
    content?: string // Added for Markdown support
}

export default function ArticleViewerPage() {
    const params = useParams()
    const docId = params.id as string
    const [article, setArticle] = useState<ArticleDetail | null>(null)
    const [versions, setVersions] = useState<ArticleVersion[]>([])
    const [selectedVersion, setSelectedVersion] = useState<ArticleVersion | null>(null)
    const [loading, setLoading] = useState(true)
    const [fileUrl, setFileUrl] = useState<string | null>(null)
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'preview' | 'text'>('preview')

    const supabase = createClient()

    const fetchData = async () => {
        setLoading(true)

        // 1. Fetch Article Metadata
        const { data: art, error: artError } = await supabase
            .from('articles')
            .select('*')
            .eq('id', docId)
            .single()

        if (artError || !art) {
            setLoading(false)
            return
        }
        setArticle(art as unknown as ArticleDetail)

        // 2. Fetch All Versions
        const { data: vers, error: verError } = await supabase
            .from('article_versions')
            .select('*')
            .eq('article_id', docId)
            .order('version_number', { ascending: false })

        if (vers && vers.length > 0) {
            setVersions(vers as unknown as ArticleVersion[])
            // Default to latest version
            if (!selectedVersion) {
                setSelectedVersion(vers[0] as unknown as ArticleVersion)
            } else {
                // If refreshing (e.g. after upload), check if we should switch to newer
                if (vers.length > versions.length) {
                    setSelectedVersion(vers[0] as unknown as ArticleVersion)
                }
            }
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [docId])

    // Update file URL when selected version changes
    useEffect(() => {
        const fetchUrl = async () => {
            if (selectedVersion) {
                const { data: urlData } = await supabase
                    .storage
                    .from('documents')
                    .createSignedUrl(selectedVersion.file_path, 3600)

                if (urlData) {
                    setFileUrl(urlData.signedUrl)
                }
            }
        }
        fetchUrl()
    }, [selectedVersion])

    if (loading) {
        return <div className="p-12 text-center text-gray-500">読み込み中...</div>
    }

    if (!article) {
        return notFound()
    }

    const isPdf = selectedVersion?.file_path.toLowerCase().endsWith('.pdf')
    const isDownloadable = article.category !== 'CHAT_LOG'

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Navigation & Header */}
            <div>
                <nav className="flex items-center justify-between mb-4">
                    <Link
                        href="/swc/dashboard/articles"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        一覧に戻る
                    </Link>

                    {/* New Version Action */}
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        改定する
                    </button>
                </nav>

                <div className="bg-white border border-gray-100 rounded-lg p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
                        <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 mb-2">
                                {ARTICLE_CATEGORIES[article.category]}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                                {article.title}
                            </h1>
                            <div className="flex items-center text-sm text-gray-400 mt-2 gap-4">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    最終更新: {new Date(article.updated_at).toLocaleDateString('ja-JP')}
                                </span>
                                {selectedVersion && (
                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                                        第{selectedVersion.version_number}版
                                    </span>
                                )}
                            </div>
                        </div>

                        {fileUrl && isDownloadable && (
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm shadow-sm"
                            >
                                <Download className="h-4 w-4" />
                                ダウンロード
                            </a>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Content Preview (Left 2 cols) */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* View Mode Tabs */}
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'preview'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <FileType className="h-4 w-4" />
                                    プレビュー
                                </button>
                                <button
                                    onClick={() => setViewMode('text')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'text'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <AlignLeft className="h-4 w-4" />
                                    テキスト (Markdown)
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-lg border border-gray-200 min-h-[500px] flex flex-col items-center justify-center overflow-hidden">
                                {selectedVersion ? (
                                    viewMode === 'preview' ? (
                                        isPdf && fileUrl ? (
                                            <iframe
                                                src={fileUrl}
                                                className="w-full h-[600px]"
                                                title="Document Preview"
                                            />
                                        ) : (
                                            <div className="text-center p-8">
                                                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-600 font-medium mb-1">プレビューできません</p>
                                                <p className="text-sm text-gray-400 mb-4">このファイル形式はブラウザでのプレビューに対応していません。</p>
                                                {fileUrl && isDownloadable && (
                                                    <a
                                                        href={fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        ファイルをダウンロードして確認
                                                    </a>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        // Text Mode
                                        <div className="p-6 bg-white h-full min-h-[600px] w-full overflow-y-auto text-left items-start justify-start flex">
                                            {selectedVersion.content ? (
                                                <article className="prose prose-sm max-w-none text-gray-800 w-full">
                                                    <ReactMarkdown>
                                                        {selectedVersion.content}
                                                    </ReactMarkdown>
                                                </article>
                                            ) : (
                                                <div className="text-center py-12 text-gray-400 w-full self-center">
                                                    テキストデータがありません
                                                </div>
                                            )}
                                        </div>
                                    )
                                ) : (
                                    <div className="text-gray-400">
                                        登録された文書ファイルがありません
                                    </div>
                                )}
                            </div>

                            {/* Selected Version Details */}
                            {selectedVersion && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">選択中の版の情報</h3>
                                    <dl className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <dt className="text-xs text-gray-500 mb-1">施行日</dt>
                                            <dd className="font-medium text-gray-900">{selectedVersion.effective_date}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-gray-500 mb-1">改定内容</dt>
                                            <dd className="font-medium text-gray-900">{selectedVersion.changelog || '記述なし'}</dd>
                                        </div>
                                    </dl>
                                </div>
                            )}
                        </div>

                        {/* Version History (Right 1 col) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-2">
                                <History className="h-4 w-4" />
                                改定履歴
                            </div>
                            <div className="space-y-3">
                                {versions.map((ver) => (
                                    <button
                                        key={ver.id}
                                        onClick={() => setSelectedVersion(ver)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${selectedVersion?.id === ver.id
                                            ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                            : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${selectedVersion?.id === ver.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                第{ver.version_number}版
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(ver.created_at).toLocaleDateString('ja-JP')}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 mb-1">
                                            {ver.effective_date} 施行
                                        </div>
                                        <div className="text-xs text-gray-500 line-clamp-2">
                                            {ver.changelog}
                                        </div>
                                    </button>
                                ))}
                                {versions.length === 0 && (
                                    <div className="text-sm text-gray-400 text-center py-4">
                                        履歴はありません
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => {
                    setIsUploadOpen(false)
                    fetchData()
                }}
                articleId={article.id}
                initialTitle={article.title}
                initialCategory={article.category}
            />
        </div>
    )
}
