'use client'

import { ShieldCheck } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <ShieldCheck className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">
                            S級AI事務局 葵さん
                        </span>
                    </div>

                    <div className="flex gap-8 text-sm text-gray-400">
                        <a href="#" className="hover:text-white transition-colors">プライバシーポリシー</a>
                        <a href="#" className="hover:text-white transition-colors">利用規約</a>
                        <a href="#" className="hover:text-white transition-colors">特定商取引法に基づく表記</a>
                        <a href="#" className="hover:text-white transition-colors">お問い合わせ</a>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
                    &copy; 2025 S級AI事務局 葵さん All rights reserved.
                </div>
            </div>
        </footer>
    )
}
