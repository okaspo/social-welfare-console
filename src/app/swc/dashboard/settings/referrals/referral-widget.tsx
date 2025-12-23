'use client';

import { useState } from 'react';
import { generateReferralCode } from './actions';
import { Copy, CheckCircle2, Share2, Sparkles, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralWidget({
    initialCode,
    initialStats
}: {
    initialCode?: string | null,
    initialStats: { total: number, converted: number, reward: number }
}) {
    const [code, setCode] = useState<string | null>(initialCode || null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const newCode = await generateReferralCode();
            setCode(newCode);
            toast.success('紹介リンクを発行しました！');
        } catch (e) {
            toast.error('発行に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!code) return;
        const url = `${window.location.origin}/signup?ref=${code}`;
        navigator.clipboard.writeText(url);
        toast.success('リンクをコピーしました');
    };

    if (!code) {
        return (
            <div className="text-center py-8">
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all text-lg disabled:opacity-50"
                >
                    <Sparkles className="h-5 w-5" />
                    {loading ? '発行中...' : '紹介リンクを発行する'}
                </button>
                <p className="text-sm text-gray-400 mt-4">ボタンを押すと専用URLが生成されます</p>
            </div>
        );
    }

    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${code}`;

    return (
        <div className="space-y-8">
            {/* Link Area */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block">あなたの紹介リンク</label>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={shareUrl}
                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg px-4 py-3 font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    />
                    <button
                        onClick={copyToClipboard}
                        className="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        <Copy className="h-4 w-4" />
                        コピー
                    </button>
                </div>
                <div className="flex gap-4 mt-4 justify-center">
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`社会福祉法人向けAI事務局「GovAI Console」をおすすめします！\n\n#GovAI #社会福祉\n${shareUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-bold text-[#1DA1F2] hover:underline bg-[#1DA1F2]/10 px-3 py-1.5 rounded-full"
                    >
                        X (Twitter) でシェア
                    </a>
                </div>
            </div>

            {/* Stats Area */}
            <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-8">
                <div className="text-center">
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">クリック数</div>
                    <div className="text-2xl font-bold text-gray-900">{initialStats.total}</div>
                </div>
                <div className="text-center border-l border-gray-100">
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">登録完了</div>
                    <div className="text-2xl font-bold text-gray-900">{initialStats.converted}</div>
                </div>
                <div className="text-center border-l border-gray-100">
                    <div className="text-orange-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                        <Trophy className="h-3 w-3" />
                        獲得報酬
                    </div>
                    <div className="text-2xl font-bold text-orange-600">¥{initialStats.reward.toLocaleString()}</div>
                </div>
            </div>
        </div>
    );
}
