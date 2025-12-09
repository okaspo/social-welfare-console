'use client'

import { Bot, FileText, Building2, Shield, Search, PenTool } from 'lucide-react'

const features = [
    {
        icon: Bot,
        title: 'S級AI「葵さん」',
        description: '社会福祉法に特化したAIアシスタント。日々の疑問解決から文書作成の補助まで、24時間365日サポートします。'
    },
    {
        icon: FileText,
        title: '議事録・書類自動作成',
        description: '理事会・評議員会の議事録を、テンプレートとAIの力で短時間で作成。法令要件を満たしたフォーマットで安心です。'
    },
    {
        icon: Building2,
        title: '法人情報の一元管理',
        description: '役員情報、任期管理、定款・規程など、法人運営に必要な情報をクラウドで一元管理。情報の属人化を防ぎます。'
    },
    {
        icon: Search,
        title: '法令・規程検索',
        description: '膨大な社会福祉法や内部規程の中から、必要な情報をAIが即座に検索・提示。条文確認の手間を大幅に削減します。'
    },
    {
        icon: Shield,
        title: 'セキュアな環境',
        description: '法人の重要情報は、強固なセキュリティ（RLS）で守られた環境に保存。組織外へのデータ流出を防ぎます。'
    },
    {
        icon: PenTool,
        title: '役員任期管理',
        description: '忘れがちな役員の任期満了をシステムが管理。適切な時期にアラートを出し、改選手続き漏れを防ぎます。'
    }
]

export function Features() {
    return (
        <section id="features" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
                        法人運営の「困った」を、<br />
                        まるごと解決します。
                    </h2>
                    <p className="text-lg text-gray-500">
                        法令遵守と業務効率化の両立。それが「S級AI事務局 葵さん」の使命です。
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                                <feature.icon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
