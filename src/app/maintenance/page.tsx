'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <AlertCircle className="h-10 w-10 text-white" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-center text-gray-900 mb-3">
                    システムメンテナンス中
                </h1>

                {/* Subtitle */}
                <p className="text-center text-gray-600 mb-6 text-lg">
                    現在、システムのメンテナンスを実施しています
                </p>

                {/* Assistant Status */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <p className="text-center text-blue-900 font-medium mb-3">
                        AI事務局からのお知らせ
                    </p>
                    <div className="space-y-2 text-sm text-blue-800">
                        <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            葵さんがお休みしています
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                            秋さんがお休みしています
                        </p>
                        <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                            亜美さんがお休みしています
                        </p>
                    </div>
                </div>

                {/* Message */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-700 text-center">
                        復旧まで今しばらくお待ちください
                        <br />
                        緊急の場合は管理者にお問い合わせください
                    </p>
                </div>

                {/* Reload Button */}
                <button
                    onClick={() => window.location.reload()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                    <RefreshCw className="h-4 w-4" />
                    再読み込み
                </button>

                {/* Footer */}
                <p className="text-xs text-gray-400 text-center mt-6">
                    ご不便をおかけして申し訳ございません
                </p>
            </div>
        </div>
    );
}
