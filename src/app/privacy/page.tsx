import { Header } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

                <div className="prose prose-indigo max-w-none text-gray-600 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">1. 個人情報の収集・利用について</h2>
                        <p>
                            当社は、本サービスの提供にあたり、ユーザーの皆様から以下の情報を取得・利用します。
                            収集した情報は、本サービスの提供、改善、およびユーザーサポートのために利用されます。
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>氏名、メールアドレス、電話番号等の連絡先情報</li>
                            <li>所属法人情報、役職情報</li>
                            <li>本サービスの利用履歴、ログデータ</li>
                            <li>お問い合わせ内容</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">2. 個人情報の第三者提供</h2>
                        <p>
                            当社は、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">3. AIモデルの学習について</h2>
                        <p>
                            ユーザーが入力した個人情報や機密情報（議事録データ等）は、AIモデルの学習データとして利用されることはありません。
                            ただし、システム改善のための統計データとして、個人を特定できない形式で利用する場合があります。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">4. 安全管理措置</h2>
                        <p>
                            当社は、個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">5. お問い合わせ窓口</h2>
                        <p>
                            本ポリシーに関するお問い合わせは、お問い合わせフォームよりお願いいたします。
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    )
}
