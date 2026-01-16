// Feedback Submission Form
// Allow users to submit feedback and feature requests

'use client';

import { useState } from 'react';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function FeedbackForm() {
    const [type, setType] = useState<'feedback' | 'feature' | 'bug'>('feedback');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!message.trim()) return;

        setSubmitting(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('ログインが必要です');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id, full_name')
                .eq('id', user.id)
                .single();

            // Save to audit_logs as feedback
            const { error } = await supabase.from('audit_logs').insert({
                action_type: `user_${type}`,
                target_type: 'system',
                target_id: user.id,
                metadata: {
                    type,
                    message,
                    userName: profile?.full_name,
                    organizationId: profile?.organization_id,
                    timestamp: new Date().toISOString(),
                },
            });

            if (error) throw error;

            setSubmitted(true);
            setMessage('');

            setTimeout(() => setSubmitted(false), 3000);
        } catch (error: any) {
            console.error('Feedback submission error:', error);
            alert('送信に失敗しました。もう一度お試しください。');
        } finally {
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    フィードバックありがとうございます！
                </h3>
                <p className="text-gray-600">
                    貴重なご意見は開発チームが確認し、今後の改善に活かさせていただきます。
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">フィードバック送信</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        種類
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setType('feedback')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'feedback'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            一般フィードバック
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('feature')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'feature'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            機能リクエスト
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('bug')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'bug'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            バグ報告
                        </button>
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label
                        htmlFor="feedback-message"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        メッセージ
                    </label>
                    <textarea
                        id="feedback-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder={
                            type === 'feedback'
                                ? 'サービスに関するご意見やご感想をお聞かせください...'
                                : type === 'feature'
                                    ? 'こんな機能があったら便利だと思うことを教えてください...'
                                    : '不具合の内容と発生手順を詳しく教えてください...'
                        }
                        required
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        '送信中...'
                    ) : (
                        <>
                            <Send className="h-4 w-4" />
                            送信する
                        </>
                    )}
                </button>
            </form>

            <p className="mt-4 text-xs text-gray-500 text-center">
                お送りいただいた内容は開発チームが確認します。
                <br />
                個別の返信は行っておりませんが、貴重なご意見として活用させていただきます。
            </p>
        </div>
    );
}
