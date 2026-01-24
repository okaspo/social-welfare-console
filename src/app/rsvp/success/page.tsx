/**
 * RSVP Success Page - 出席確認回答完了ページ
 */

export default async function RSVPSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ response?: string }>;
}) {
    const params = await searchParams;
    const response = params.response;
    const isAttending = response === 'attending';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
                <div className="mb-6">
                    <div
                        className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl ${isAttending
                                ? 'bg-green-100 dark:bg-green-900'
                                : 'bg-red-100 dark:bg-red-900'
                            }`}
                    >
                        {isAttending ? '✅' : '❌'}
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                    回答を受け付けました
                </h1>

                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    {isAttending
                        ? 'ご出席いただけるとのこと、ありがとうございます。当日お待ちしております。'
                        : 'ご欠席のご連絡ありがとうございます。次回のご参加をお待ちしております。'}
                </p>

                <div
                    className={`inline-block px-6 py-3 rounded-lg font-semibold ${isAttending
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}
                >
                    {isAttending ? '✓ 出席' : '✗ 欠席'}
                </div>

                <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
                    このウィンドウは閉じていただいて構いません。
                </p>
            </div>
        </div>
    );
}
