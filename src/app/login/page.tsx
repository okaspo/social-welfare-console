'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                throw error
            }

            router.push('/dashboard')
        } catch (err) {
            // Graceful fallback if env vars are missing (mock mode)
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
                console.warn("Supabase credentials missing, simulating success for UI demo.")
                router.push('/dashboard?mock=true')
            } else {
                setError((err as Error).message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-full max-w-[400px] p-8 space-y-6">

                {/* Header */}
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        ログイン
                    </h1>
                    <p className="text-sm text-gray-500">
                        S級事務局 葵さん
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                            メールアドレス
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            required
                            className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-200 rounded-md ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                パスワード
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-xs text-gray-500 hover:text-gray-900 underline-offset-4 hover:underline transition-colors"
                            >
                                パスワードをお忘れですか？
                            </Link>
                        </div>

                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-200 rounded-md ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
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
                            "ログイン"
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="text-center text-sm">
                    <Link
                        href="/signup"
                        className="text-gray-500 hover:text-gray-900 underline-offset-4 hover:underline transition-colors"
                    >
                        アカウント作成（新規登録）
                    </Link>
                </div>
            </div>
        </div>
    )
}
