'use client';

import { useState } from 'react';
import { submitConsent } from '../actions';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConsentForm({
    token,
    initialStatus,
    officerName
}: {
    token: string,
    initialStatus: string,
    officerName: string
}) {
    const [status, setStatus] = useState(initialStatus);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConsent = async (agreed: boolean) => {
        if (loading) return;
        setLoading(true);
        setError(null);

        try {
            await submitConsent(token, agreed);
            setStatus(agreed ? 'agreed' : 'rejected');
        } catch (e) {
            setError('送信に失敗しました。もう一度お試しください。');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'agreed') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center"
            >
                <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-emerald-900 mb-2">同意を確認しました</h3>
                <p className="text-emerald-700">
                    {officerName} 様の同意日時とIPアドレスが記録されました。<br />
                    ご協力ありがとうございました。
                </p>
            </motion.div>
        );
    }

    if (status === 'rejected') {
        return (
            <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
                <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-2">否認を確認しました</h3>
                <p className="text-red-700">
                    本提案への不同意が記録されました。
                </p>
                <button
                    onClick={() => setStatus('pending')}
                    className="mt-4 text-sm text-red-600 underline hover:text-red-800"
                >
                    選択をやり直す
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900 text-center">
                本提案に同意されますか？
            </h3>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <button
                    onClick={() => handleConsent(false)}
                    disabled={loading}
                    className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <XCircle className="h-8 w-8 text-gray-400 group-hover:text-red-500 mb-3 transition-colors" />
                    <span className="font-bold text-gray-600 group-hover:text-red-700">同意しない</span>
                </button>

                <button
                    onClick={() => handleConsent(true)}
                    disabled={loading}
                    className="flex flex-col items-center justify-center p-6 border-2 border-indigo-200 bg-indigo-50/50 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-all group shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-3" />
                    ) : (
                        <CheckCircle2 className="h-8 w-8 text-indigo-600 mb-3" />
                    )}
                    <span className="font-bold text-indigo-700">同意する (署名)</span>
                </button>
            </div>

            <p className="text-center text-xs text-gray-400">
                「同意する」ボタンを押すと、電子署名法に基づいた同意記録として保存されます。
            </p>
        </div>
    );
}
