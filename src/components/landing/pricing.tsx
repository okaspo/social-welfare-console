'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'

const plans = [
    {
        name: 'FREE',
        price: '0',
        description: 'まずは無料で機能を体験',
        features: [
            'AIチャット機能 (制限あり)',
            '議事録作成 (月2件まで)',
            '役員管理',
            'シングルユーザー'
        ],
        buttonText: '無料で始める',
        href: '/signup',
        popular: false
    },
    {
        name: 'STANDARD',
        price: '9,800',
        description: '小規模法人向け基本プラン',
        features: [
            'AIチャット機能 (無制限)',
            '議事録作成 (無制限)',
            '役員管理・任期アラート',
            '定款・規程管理',
            'シングルユーザー'
        ],
        buttonText: 'スタンダードで登録',
        href: '/signup',
        popular: true
    },
    {
        name: 'PRO',
        price: '29,800',
        description: '複数人での運営に最適',
        features: [
            'STANDARDプランの全機能',
            'マルチユーザー (5名まで)',
            '権限管理機能',
            '優先サポート',
            '専任担当者による導入支援'
        ],
        buttonText: 'プロプランで登録',
        href: '/signup',
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
                        必要な機能に合わせて、最適なプランをお選びいただけます。
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`relative p-8 rounded-3xl border ${plan.popular ? 'border-indigo-600 bg-indigo-50/50 shadow-xl scale-105 z-10' : 'border-gray-200 bg-white hover:border-indigo-200 transition-colors'}`}>
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full tracking-wide">
                                    POPULAR
                                </div>
                            )}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-gray-900">¥{plan.price}</span>
                                    <span className="text-gray-500">/月</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-indigo-600 shrink-0" />
                                        <span className="text-sm text-gray-600">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.href}
                                className={`block w-full text-center py-3 rounded-xl font-medium transition-all ${plan.popular
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
