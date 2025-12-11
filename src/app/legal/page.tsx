import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">特定商取引法に基づく表記</h1>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <dl className="divide-y divide-gray-200">
                        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 hover:bg-gray-50">
                            <dt className="text-sm font-medium text-gray-900">販売業者</dt>
                            <dd className="text-sm text-gray-600 sm:col-span-2">GovTech株式会社（仮称）</dd>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 hover:bg-gray-50">
                            <dt className="text-sm font-medium text-gray-900">運営統括責任者</dt>
                            <dd className="text-sm text-gray-600 sm:col-span-2">代表取締役 田中 太郎</dd>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 hover:bg-gray-50">
                            <dt className="text-sm font-medium text-gray-900">所在地</dt>
                            <dd className="text-sm text-gray-600 sm:col-span-2">〒100-0000 東京都千代田区...</dd>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 hover:bg-gray-50">
                            <dt className="text-sm font-medium text-gray-900">電話番号</dt>
                            <dd className="text-sm text-gray-600 sm:col-span-2">03-0000-0000 <br /><span className="text-xs text-gray-500">※お問い合わせは原則として専用フォームよりお願いいたします。</span></dd>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 hover:bg-gray-50">
                            <dt className="text-sm font-medium text-gray-900">メールアドレス</dt>
                            <dd className="text-sm text-gray-600 sm:col-span-2">support@example.com</dd>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 hover:bg-gray-50">
                            <dt className="text-sm font-medium text-gray-900">販売価格</dt>
                            <dd className="text-sm text-gray-600 sm:col-span-2">各プランの紹介ページに記載しています（表示価格は税抜です）。</dd>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 hover:bg-gray-50">
                            <dt className="text-sm font-medium text-gray-900">商品代金以外の必要料金</dt>
                            <dd className="text-sm text-gray-600 sm:col-span-2">消費税、インターネット接続料金、通信料金</dd>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 hover:bg-gray-50">
                            <dt className="text-sm font-medium text-gray-900">お支払い方法</dt>
                            <dd className="text-sm text-gray-600 sm:col-span-2">クレジットカード決済、請求書払い（法人契約のみ）</dd>
                        </div>
                        <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 hover:bg-gray-50">
                            <dt className="text-sm font-medium text-gray-900">解約について</dt>
                            <dd className="text-sm text-gray-600 sm:col-span-2">
                                解約をご希望の場合は、ダッシュボードの設定画面またはお問い合わせフォームよりお手続きください。
                                次回決済日の前日までに解約手続きを行うことで、次月の請求は発生しません。
                                なお、日割り計算による返金は行っておりません。
                            </dd>
                        </div>
                    </dl>
                </div>
            </main>
            <Footer />
        </div>
    )
}
