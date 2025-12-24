import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

export default async function SwcFeedbackPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch Feedback (Assuming 'chat_feedback' or similar table, or relying on logs)
    // For now, placeholder UI as feedback table wasn't explicitly migrated or checked yet

    return (
        <div className="p-6">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>社会福祉法人コンソール</span>
                    <span>/</span>
                    <span>フィードバック</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">ユーザーフィードバック</h1>
                <p className="text-gray-600 mt-1">
                    AIの回答に対するユーザーの評価を表示します。
                </p>
            </div>

            <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">フィードバック機能は準備中です</h3>
                <p className="mt-1">チャットUIからのフィードバック収集機構と連携予定です。</p>
            </div>
        </div>
    );
}
