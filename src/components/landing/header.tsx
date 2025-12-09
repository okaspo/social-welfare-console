'use client'

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-900">
                        S級AI事務局 葵さん
                    </span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                    <a href="#features" className="hover:text-gray-900 transition-colors">機能</a>
                    <a href="#pricing" className="hover:text-gray-900 transition-colors">料金プラン</a>
                    <a href="/login" className="hover:text-gray-900 transition-colors">ログイン</a>
                    <Link
                        href="/signup"
                        className="px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        無料で始める
                    </Link>
                </nav>

                {/* Mobile Menu Button - simplified for now */}
                <div className="md:hidden">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-gray-900"
                    >
                        ログイン
                    </Link>
                </div>
            </div>
        </header>
    )
}
