'use client';

/**
 * Feedback Dialog - フィードバック送信ダイアログ
 */

import { useState } from 'react';
import { MessageSquare, Bug, Lightbulb, Send, X } from 'lucide-react';

interface FeedbackDialogProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId?: string;
}

type FeedbackType = 'bug' | 'feature' | 'general';

export function FeedbackDialog({ isOpen, onClose, organizationId }: FeedbackDialogProps) {
    const [type, setType] = useState<FeedbackType>('general');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, content, organizationId }),
            });

            if (response.ok) {
                setSubmitted(true);
                setTimeout(() => {
                    onClose();
                    setSubmitted(false);
                    setContent('');
                    setType('general');
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const typeOptions = [
        { value: 'bug', label: 'バグ報告', icon: Bug, color: 'text-red-500' },
        { value: 'feature', label: '機能要望', icon: Lightbulb, color: 'text-amber-500' },
        { value: 'general', label: 'その他', icon: MessageSquare, color: 'text-blue-500' },
    ] as const;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        📝 フィードバック送信
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {submitted ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-3xl">
                            ✅
                        </div>
                        <p className="text-lg font-medium text-slate-800 dark:text-slate-100">
                            送信完了
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            ご意見ありがとうございます！
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        {/* Type Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                種類
                            </label>
                            <div className="flex gap-2">
                                {typeOptions.map((option) => {
                                    const Icon = option.icon;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setType(option.value)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-all ${type === option.value
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                                                }`}
                                        >
                                            <Icon className={`h-4 w-4 ${option.color}`} />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {option.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                内容
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="ご意見・ご要望をお聞かせください..."
                                rows={5}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!content.trim() || isSubmitting}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Send className="h-4 w-4" />
                            {isSubmitting ? '送信中...' : '送信する'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
