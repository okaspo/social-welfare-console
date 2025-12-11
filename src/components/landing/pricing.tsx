'use client'

import { Check, X } from 'lucide-react'
import Link from 'next/link'

const plans = [
    {
        name: 'フリー (Free)',
        price: '0',
        target: '事務担当者・管理者（個人的な動作確認・お試し）',
        description: '「本当にウチの定款に合った議事録が作れるの？」という疑念を払拭するための体験プラン',
        features: [
            'AI議事録生成の体験',
            '法令適合性チェックの体験',
            '保存件数：3件まで'
        ],
        notIncluded: [
            'Wordダウンロード不可（画面での閲覧のみ）'
        ],
        buttonText: '無料で始める',
        href: '/signup',
        popular: false
    },
    {
        name: 'スタンダード (Standard)',
        price: '24,800',
        target: '小規模法人（保育園1園など、単体施設）',
        description: '複合機のリース代と同程度。毎回の文字起こしと清書の残業がなくなるなら「安い投資」です。',
        features: [
            'Word形式ダウンロード解禁（実務で使える）',
            '議事録・議案書の作成（月10回程度まで）',
            '過去の会議データの保存・検索'
        ],
        buttonText: 'スタンダードで登録',
        href: '/signup',
        popular: true
    },
    {
        name: 'プロ (Pro)',
        price: '54,800',
        target: '中規模法人（事務局があり、会議調整が負担）',
        description: '専門家顧問料(5~10万)より割安。招集手続きと定足数管理までAIが代行し、決議無効リスクを回避。',
        features: [
            '招集通知の一括送信・出欠管理機能',
            '委任状の自動生成・定足数のリアルタイム判定',
            '司法書士レベルの高度な法務チェック',
            '法人固有ルール（定款・規程）のAI学習'
        ],
        buttonText: 'プロプランで登録',
        href: '/signup',
        popular: false
    },
    {
        name: 'エンタープライズ (Enterprise)',
        price: '98,000',
        target: '大規模法人・グループ本部（複数施設を統括管理したい）',
        description: '事務職員1名の半額以下で、10万円未満の決裁で導入可能。現場入力で事業報告書を完全自動化。',
        features: [
            '事業報告書の完全自動生成',
            '現場入力機能（各施設からスマホでネタ投稿）',
            'AI模擬監査（全文書の法令違反自動検知）',
            '複数施設管理・ユーザー権限設定（本部/施設長など）'
        ],
        buttonText: 'お問い合わせ',
        href: '/contact',
        popular: false
    }
]

export function Pricing() {
    return (
        <section id="pricing" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
                        法人規模に合わせた料金プラン
                    </h2>
                    <p className="text-lg text-gray-500">
                        規模や課題に合わせて最適なプランをお選びください。
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`relative flex flex-col p-6 rounded-2xl border ${plan.popular ? 'border-indigo-600 bg-indigo-50/50 shadow-xl z-10' : 'border-gray-200 bg-white hover:border-indigo-200 transition-colors'}`}>
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full tracking-wide">
                                    おすすめ
                                </div>
                            )}
                            <div className="mb-6 flex-1">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-3xl font-extrabold text-gray-900">¥{plan.price}</span>
                                    <span className="text-gray-500 text-sm">/月 (税抜)</span>
                                </div>
                                <p className="text-xs text-indigo-600 font-medium mb-1">{plan.target}</p>
                                <p className="text-sm text-gray-500 font-bold">{plan.description}</p>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features?.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2">
                                        <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                                        <span className="text-xs text-gray-700">{feature}</span>
                                    </li>
                                ))}
                                {plan.notIncluded?.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2">
                                        <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                        <span className="text-xs text-gray-500">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.href}
                                className={`block w-full text-center py-2.5 rounded-lg text-sm font-medium transition-all ${plan.popular
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    }`}
                            >
                                {plan.buttonText}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
