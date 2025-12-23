'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { getURL } from '@/lib/get-url'
import { login } from './actions'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

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

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-400">または</span>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <button
                            type="button"
                            onClick={async () => {
                                await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: `${getURL()}/auth/callback?next=/swc/dashboard`,
                                        queryParams: {
                                            access_type: 'offline',
                                            prompt: 'consent',
                                        },
                                    },
                                })
                            }}
                            className="w-full h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 shadow-sm"
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Googleアカウントでログイン
                        </button>

                        <button
                            type="button"
                            onClick={async () => {
                                await supabase.auth.signInWithOAuth({
                                    provider: 'azure',
                                    options: {
                                        redirectTo: `${getURL()}/auth/callback?next=/swc/dashboard`,
                                        scopes: 'email profile openid',
                                    },
                                })
                            }}
                            className="w-full h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#2F2F2F] text-white hover:bg-[#2F2F2F]/90 shadow-sm"
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
                                <path fill="#f35325" d="M1 1h10v10H1z" />
                                <path fill="#81bc06" d="M12 1h10v10H12z" />
                                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                <path fill="#ffba08" d="M12 12h10v10H12z" />
                            </svg>
                            Microsoftアカウントでログイン
                        </button>

                        <button
                            type="button"
                            onClick={async () => {
                                await supabase.auth.signInWithOAuth({
                                    provider: 'line' as any,
                                    options: {
                                        redirectTo: `${getURL()}/auth/callback?next=/swc/dashboard`,
                                        scopes: 'profile openid email',
                                    },
                                })
                            }}
                            className="w-full h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#06C755] text-white hover:bg-[#06C755]/90 shadow-sm"
                        >
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 30 30" fill="currentColor">
                                <defs>
                                    <clipPath id="clip0_101_2">
                                        <rect width="30" height="30" fill="white" />
                                    </clipPath>
                                </defs>
                                <path d="M25.4 12.3C25.4 6.7 19.8 2.2 12.9 2.2C6 2.2 0.3 6.7 0.3 12.3C0.3 17 4.1 21 9.4 22.1C9.6 22.1 10 22.2 10.1 22.5C10.2 22.7 10.2 23.3 10.2 23.6C10.1 24.3 9.8 25.8 9.8 26C9.7 26.3 9.7 27 10.3 26.7C10.9 26.4 18.7 21 21.9 17.5C24.1 16 25.4 14.3 25.4 12.3ZM8.4 15.6H4.7C4.3 15.6 4 15.3 4 15V9.4C4 9.1 4.3 8.8 4.7 8.8C5 8.8 5.3 9.1 5.3 9.4V14.3H8.4C8.7 14.3 9 14.6 9 15C9 15.3 8.7 15.6 8.4 15.6ZM11.1 15C11.1 15.3 10.8 15.6 10.5 15.6C10.2 15.6 9.8 15.3 9.8 15V9.4C9.8 9.1 10.1 8.8 10.5 8.8C10.8 8.8 11.1 9.1 11.1 9.4V15ZM16.8 15C16.8 15.3 16.5 15.6 16.2 15.6C16 15.6 15.7 15.4 15.6 15.2L13.1 11.7V15C13.1 15.3 12.8 15.6 12.5 15.6C12.1 15.6 11.8 15.3 11.8 15V9.4C11.8 9.1 12.1 8.8 12.4 8.8C12.6 8.8 12.9 8.9 13.1 9.2L15.6 12.7V9.4C15.6 9.1 15.8 8.8 16.2 8.8C16.5 8.8 16.8 9.1 16.8 9.4V15ZM21.5 14.3H18.4V12.7H21.5C21.9 12.7 22.1 12.4 22.1 12.1C22.1 11.8 21.9 11.5 21.5 11.5H18.4V9.9H21.5C21.9 9.9 22.1 9.6 22.1 9.3C22.1 9 21.9 8.7 21.5 8.7H17.7C17.4 8.7 17.1 9 17.1 9.3V15.1C17.1 15.4 17.4 15.7 17.7 15.7H21.5C21.9 15.7 22.1 15.4 22.1 15.1C22.1 14.8 21.8 14.3 21.5 14.3Z" fill="white" />
                            </svg>
                            LINEでログイン (スマホ推奨)
                        </button>
                    </div>

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
