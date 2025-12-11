'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
            <div className="bg-red-50 p-6 rounded-xl border border-red-100 max-w-lg w-full">
                <h2 className="text-lg font-bold text-red-700 mb-2">エラーが発生しました</h2>
                <p className="text-sm text-red-600 mb-4 bg-white p-3 rounded border border-red-100 font-mono text-left overflow-auto max-h-32">
                    {error.message || '不明なエラーが発生しました'}
                </p>
                <p className="text-xs text-gray-500 mb-6">
                    アプリケーションの読み込み中に問題が発生しました。<br />
                    環境変数が正しく設定されていない可能性があります。
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        ページを再読み込み
                    </button>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors shadow-sm"
                    >
                        再試行する
                    </button>
                </div>
            </div>
        </div>
    )
}
