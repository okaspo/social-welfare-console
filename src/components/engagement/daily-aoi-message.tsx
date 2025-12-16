// Daily Aoi Message Component
// Display a random motivational/helpful message from Aoi

'use client';

import { useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

const AOI_MESSAGES = [
    '今日も一日、頑張りましょう！💙 何かお困りのことがあれば、いつでもお声がけください。',
    '書類整理は大変ですよね。でも、一つずつ丁寧に進めていけば大丈夫です✨',
    '役員会の準備、お疲れ様です。定款を確認しながら進めると安心ですよ！',
    '助成金の申請期限、忘れずにチェックしてくださいね📅 必要なら検索をお手伝いします。',
    '今日は少し休憩しませんか？☕ リフレッシュも大切ですよ。',
    '法人運営、本当にお疲れ様です。地域のために頑張る皆さんを応援しています！',
    '議事録の作成、お任せください📝 テンプレートを使えば簡単に作れますよ。',
    'データのバックアップ、定期的に取っていますか？👀 大切な情報は守りましょう。',
    '新しい制度や法改正、気になることがあればいつでも聞いてくださいね。',
    '葵さんからの一言：完璧を目指さなくても大丈夫。着実に進めることが大切です✨',
];

export default function DailyAoiMessage() {
    const [message, setMessage] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    function getRandomMessage() {
        const randomIndex = Math.floor(Math.random() * AOI_MESSAGES.length);
        return AOI_MESSAGES[randomIndex];
    }

    function refreshMessage() {
        setIsRefreshing(true);
        setTimeout(() => {
            setMessage(getRandomMessage());
            setIsRefreshing(false);
        }, 300);
    }

    useEffect(() => {
        setMessage(getRandomMessage());
    }, []);

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">今日の葵さんの一言</h3>
                </div>
                <button
                    onClick={refreshMessage}
                    disabled={isRefreshing}
                    className="p-1 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                    title="別のメッセージを表示"
                >
                    <RefreshCw
                        className={`h-4 w-4 text-blue-600 ${isRefreshing ? 'animate-spin' : ''
                            }`}
                    />
                </button>
            </div>
            <p className="text-gray-700 leading-relaxed">{message}</p>
        </div>
    );
}
