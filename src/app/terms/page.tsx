import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>

                <div className="prose prose-indigo max-w-none text-gray-600 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">第1条（適用）</h2>
                        <p>
                            本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">第2条（利用登録）</h2>
                        <p>
                            登録希望者が当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">第3条（禁止事項）</h2>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>法令または公序良俗に違反する行為</li>
                            <li>犯罪行為に関連する行為</li>
                            <li>本サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                            <li>当社のサービスの運営を妨害するおそれのある行為</li>
                            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">第4条（免責事項：AI生成物について）</h2>
                        <p>
                            本サービスにより生成される議事録、議案書、および法的助言を含む回答（以下「生成物」といいます）は、AI技術を用いて作成されたものです。
                            当社は、生成物の正確性、完全性、法的適合性について最大限の努力を払いますが、これを保証するものではありません。
                            生成物の利用に際しては、必ずユーザー自身の責任において内容を確認し、必要に応じて専門家（弁護士、司法書士等）に相談してください。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">第5条（サービス内容の変更等）</h2>
                        <p>
                            当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとします。
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    )
}
