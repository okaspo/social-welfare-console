'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, FileText, ArrowRight } from 'lucide-react'
import { ARTICLE_CATEGORIES, ArticleCategory } from '@/lib/articles/data'
import { useRouter } from 'next/navigation'

interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    articleId?: string
    initialTitle?: string
    initialCategory?: string
}

export default function UploadModal({ isOpen, onClose, articleId, initialTitle, initialCategory }: UploadModalProps) {

    const [step, setStep] = useState<'upload' | 'markdown'>('upload')
    const [loading, setLoading] = useState(false)
    const [conversionLoading, setConversionLoading] = useState(false)

    // Form State
    const [title, setTitle] = useState(initialTitle || '')
    const [category, setCategory] = useState<ArticleCategory>(initialCategory as ArticleCategory || 'TEIKAN')
    const [effectiveDate, setEffectiveDate] = useState('')
    const [changelog, setChangelog] = useState('')
    const [file, setFile] = useState<File | null>(null)

    // Result State
    const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
    const [markdownContent, setMarkdownContent] = useState('')

    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const supabase = createClient()
    const [isDragging, setIsDragging] = useState(false)

    if (!isOpen) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
        }
    }

    const handleInitialUpload = async () => {
        if (!file || !title || !effectiveDate) return
        setLoading(true)
        setConversionLoading(true)

        try {
            // 1. Upload File to Supabase
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const filePath = `articles/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError
            setUploadedFilePath(filePath)

            // 2. Call Conversion API
            try {
                const res = await fetch('/api/convert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filePath })
                })

                if (res.ok) {
                    const data = await res.json()
                    setMarkdownContent(data.content || '')
                } else {
                    console.error('Conversion failed', await res.text())
                    // Example specific error handling or toast could go here
                }
            } catch (convError) {
                console.warn('Conversion API error, proceeding without markdown', convError)
            }

            setStep('markdown')

        } catch (error: any) {
            console.error('Upload failed:', error)
            alert('アップロードに失敗しました: ' + error.message)
        } finally {
            setLoading(false)
            setConversionLoading(false)
        }
    }

    const handleFinalSubmit = async () => {
        if (!uploadedFilePath) return
        setLoading(true)

        try {
            let targetArticleId = articleId

            // 1. Create Article if new
            if (!targetArticleId) {
                const { data: newArticle, error: articleError } = await supabase
                    .from('articles')
                    .insert({ title, category })
                    .select()
                    .single()

                if (articleError) throw articleError
                targetArticleId = newArticle.id
            }

            // 2. Determine Version Number
            let versionNumber = 1
            if (articleId) {
                const { data: versions } = await supabase
                    .from('article_versions')
                    .select('version_number')
                    .eq('article_id', articleId)
                    .order('version_number', { ascending: false })
                    .limit(1)

                if (versions && versions.length > 0) {
                    versionNumber = versions[0].version_number + 1
                }
            }

            // 3. Create Version Record with Markdown Content
            const { error: versionError } = await supabase
                .from('article_versions')
                .insert({
                    article_id: targetArticleId,
                    version_number: versionNumber,
                    effective_date: effectiveDate,
                    file_path: uploadedFilePath,
                    changelog: changelog || '初期登録',
                    content: markdownContent // Save Markdown
                })

            if (versionError) throw versionError

            onClose()
            router.refresh()

        } catch (error: any) {
            console.error('Save failed:', error)
            alert('保存に失敗しました: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                    <h3 className="font-semibold text-gray-900">
                        {step === 'upload' ? (articleId ? '新しい改定版を追加' : '新規規程の登録') : 'テキスト化結果の確認'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'upload' ? (
                        <div className="space-y-4">
                            {!articleId && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">規程名</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                            placeholder="例：定款、経理規程..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                        >
                                            {Object.entries(ARTICLE_CATEGORIES).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">施行日</label>
                                    <input
                                        type="date"
                                        value={effectiveDate}
                                        onChange={(e) => setEffectiveDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">改定内容メモ</label>
                                    <input
                                        type="text"
                                        value={changelog}
                                        onChange={(e) => setChangelog(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                        placeholder="例：法改正対応"
                                    />
                                </div>
                            </div>

                            {/* File Upload Area */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">文書ファイル (PDF/Word)</label>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx"
                                    />
                                    {file ? (
                                        <div className="flex items-center gap-2 text-blue-600 font-medium">
                                            <FileText className="h-5 w-5" />
                                            <span>{file.name}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">クリックまたはドラッグ＆ドロップ</p>
                                            <p className="text-xs text-gray-400 mt-1">PDF, Word (AIによる自動テキスト化が実行されます)</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                AIにより抽出されたテキスト (必要に応じて修正してください)
                            </label>
                            <textarea
                                value={markdownContent}
                                onChange={(e) => setMarkdownContent(e.target.value)}
                                className="flex-1 w-full p-4 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                                placeholder="テキスト抽出中..."
                            />
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>

                    {step === 'upload' ? (
                        <button
                            type="button"
                            onClick={handleInitialUpload}
                            disabled={loading || !file || !effectiveDate}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                            アップロードして次へ
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleFinalSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            保存する
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
