
import Link from 'next/link'

export default function NPODashboardPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-green-50">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-green-800">NPO法人用ダッシュボード</h1>
                <p className="text-gray-600">現在開発中です。</p>
                <div className="mt-8">
                    <Link href="/swc/dashboard" className="text-indigo-600 hover:underline">
                        社会福祉法人版へ移動 (Temporary)
                    </Link>
                </div>
            </div>
        </div>
    )
}
