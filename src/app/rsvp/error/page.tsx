/**
 * RSVP Error Page - 出席確認回答エラーページ
 */

export default async function RSVPErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ reason?: string }>;
}) {
    const params = await searchParams;
    const reason = params.reason || 'unknown';

    const errorMessages: Record<string, { title: string; message: string }> = {
        invalid_token: {
            title: '無効なリンク',
            message:
                'このリンクは無効または期限切れです。招待メールを再度ご確認ください。',
        },
        invalid_response: {
            title: '無効な回答',
            message: '回答形式が正しくありません。メールのボタンから再度お試しください。',
        },
        already_responded: {
            title: '既に回答済みです',
            message: 'この招待には既に回答いただいております。変更が必要な場合は事務局までご連絡ください。',
        },
        server_error: {
            title: 'サーバーエラー',
            message: '一時的な問題が発生しました。しばらくしてから再度お試しください。',
        },
        unknown: {
            title: 'エラーが発生しました',
            message: '予期しないエラーが発生しました。事務局までお問い合わせください。',
        },
    };

    const error = errorMessages[reason] || errorMessages.unknown;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
                <div className="mb-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-4xl">
                        ⚠️
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                    {error.title}
                </h1>

                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    {error.message}
                </p>

                <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
                    ご不明な点がございましたら、事務局までお問い合わせください。
                </p>
            </div>
        </div>
    );
}
