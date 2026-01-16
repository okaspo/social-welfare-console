'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { getURL } from '@/lib/get-url'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [corporationName, setCorporationName] = useState('')
  const [address, setAddress] = useState('')
  const [establishmentDate, setEstablishmentDate] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Use signInWithOtp for magic link authentication
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getURL()}/auth/callback?next=/swc/dashboard`,
          data: {
            full_name: fullName,
            corporation_name: corporationName,
            corporation_address: address,
            establishment_date: establishmentDate,
            corporation_phone: phone,
          }
        },
      })

      if (error) {
        throw error
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
            <span className="font-bold text-gray-800">{email}</span> 宛に登録用のリンクを送信しました。<br />
            届いたリンクをクリックして登録を完了してください。
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
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-[400px] p-8 space-y-6">

        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            アカウント登録
          </h1>
          <p className="text-sm text-gray-500">
            S級AI事務局 葵さん
            <br />
            <span className="text-xs text-gray-400">マジックリンク認証</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-4">

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

          <div className="space-y-2">
            <label htmlFor="corporationName" className="text-sm font-medium text-gray-700">
              法人名（正式名称）
            </label>
            <input
              id="corporationName"
              type="text"
              placeholder="社会福祉法人○○会"
              required
              className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-200 rounded-md ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              value={corporationName}
              onChange={(e) => setCorporationName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium text-gray-700">
              法人所在地
            </label>
            <input
              id="address"
              type="text"
              placeholder="東京都..."
              required
              className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-200 rounded-md ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="establishmentDate" className="text-sm font-medium text-gray-700">
                設立年月日
              </label>
              <input
                id="establishmentDate"
                type="date"
                required
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-200 rounded-md ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                value={establishmentDate}
                onChange={(e) => setEstablishmentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                電話番号
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="03-1234-5678"
                required
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-200 rounded-md ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              担当者氏名
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="山田 太郎"
              required
              className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-200 rounded-md ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
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
              "登録リンクを送信"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm">
          <Link
            href="/login"
            className="text-gray-500 hover:text-gray-900 underline-offset-4 hover:underline transition-colors"
          >
            すでにアカウントをお持ちの方はこちら
          </Link>
        </div>

        {/* Legal / Subtle Footer */}
        <div className="pt-8 text-center text-xs text-gray-400">
          &copy; S級AI事務局 葵さん
        </div>
      </div>
    </div>
  )
}
