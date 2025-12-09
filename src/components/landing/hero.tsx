'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-50 to-white -z-10" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-100 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2 -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium mb-8 border border-indigo-100">
                    <Sparkles className="h-3 w-3" />
                    <span>社会福祉法人専用 AI・DXソリューション</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                    社会福祉法人の事務作業を、<br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        劇的に効率化
                    </span>
                    。
                </h1>

                <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                    法令知識を持ったS級AI「葵さん」が、議事録作成から規定管理まで、<br className="hidden md:block" />
                    あなたの法人のバックオフィス業務を強力にサポートします。
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/signup"
                        className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-all hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                        無料で始める
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                        href="/login"
                        className="w-full sm:w-auto px-8 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-full font-semibold hover:bg-gray-50 transition-all hover:border-gray-300"
                    >
                        ログイン
                    </Link>
                </div>

                <div className="mt-16 relative mx-auto max-w-5xl rounded-2xl border border-gray-200 shadow-2xl overflow-hidden bg-white">
                    <div className="aspect-[16/9] bg-gray-50 flex items-center justify-center text-gray-300 text-sm">
                        {/* Placeholder for dashboard screenshot */}
                        <div className="p-8 w-full h-full flex flex-col items-center justify-center gap-4">
                            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
                            <p className="text-gray-400 mt-4">Dashboard UI Preview</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
