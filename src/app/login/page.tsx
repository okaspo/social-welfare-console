'use client'

import { useState } from 'react'
import { Loader2, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { login } from './actions'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('email', email)

            const result = await login(formData)

            if (result?.error) {
                throw new Error(result.error)
            }

            setSent(true)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-full max-w-[400px] p-8 space-y-6 text-center">
                    <div className="flex justify-center">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        メールを確認してください
                    </h1>
                    <p className="text-gray-500">
                        <span className="font-bold text-gray-800">{email}</span> 宛にログイン用のリンクを送信しました。<br />
                        届いたリンクをクリックしてログインしてください。
                    </p>
                    <div className="pt-4">
                        <button
                            onClick={() => setSent(false)}
                            className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4"
                        >
                            メールアドレスを再入力する
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Hero Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 to-purple-700">
                <img
                    src="/assets/hero/office_scene.jpg"
                    alt="S級AI事務局 葵さん"
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent" />
                <div className="relative z-10 flex flex-col justify-end p-12 text-white">
                    <h2 className="text-3xl font-bold mb-4">
                        社会福祉法人の法務DX
                    </h2>
                    <p className="text-indigo-100 text-lg">
                        S級AI事務局「葵さん」が、議事録作成から規定管理まで、<br />
                        あなたの法人のバックオフィス業務を強力にサポートします。
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
                <div className="w-full max-w-[400px] space-y-6">

                    {/* Header */}
                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                            ログイン
                        </h1>
                        <p className="text-sm text-gray-500">
                            S級AI事務局 葵さん
                            <br />
                            <span className="text-xs text-gray-400">マジックリンク認証</span>
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                メールアドレス
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    className="w-full h-10 pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-md ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-gray-50 hover:bg-gray-900/90 shadow-sm"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                "ログインリンクを送信"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center text-sm">
                        <Link
                            href="/signup"
                            className="text-gray-500 hover:text-gray-900 underline-offset-4 hover:underline transition-colors"
                        >
                            アカウントをお持ちでない方（新規登録）
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
