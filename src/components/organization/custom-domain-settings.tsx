'use client'

import { useState } from 'react'
import { Globe, Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react'
import { updateCustomDomain } from '@/lib/actions/organization'

interface CustomDomainSettingsProps {
    currentDomain?: string | null
    planType: string
}

export default function CustomDomainSettings({ currentDomain, planType }: CustomDomainSettingsProps) {
    const [domain, setDomain] = useState(currentDomain || '')
    const [isLoading, setIsLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const isPremiumPlan = planType === 'pro' || planType === 'enterprise'

    const handleSave = async () => {
        if (!isPremiumPlan) return

        setIsLoading(true)
        setStatus('idle')

        try {
            const result = await updateCustomDomain(domain)
            if (result.success) {
                setStatus('success')
                setMessage('カスタムドメインを保存しました。DNS設定を行ってください。')
            } else {
                setStatus('error')
                setMessage(result.error || '保存に失敗しました')
            }
        } catch {
            setStatus('error')
            setMessage('予期せぬエラーが発生しました')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-white border text-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5 text-gray-500" />
                    カスタムドメイン
                </h2>
                {!isPremiumPlan && (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-medium">
                        Pro/Enterprise限定
                    </span>
                )}
            </div>

            <div className="p-6 space-y-4">
                {!isPremiumPlan ? (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">
                            カスタムドメイン機能はPro/Enterpriseプランでご利用いただけます。
                        </p>
                        <a
                            href="/swc/dashboard/settings/billing"
                            className="text-indigo-600 text-sm font-medium mt-2 inline-flex items-center gap-1 hover:underline"
                        >
                            プランをアップグレード
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">カスタムドメイン</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    placeholder="portal.example.or.jp"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                                >
                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
                                </button>
                            </div>
                        </div>

                        {status !== 'idle' && (
                            <div className={`p-3 rounded-md flex items-start gap-2 ${status === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                }`}>
                                {status === 'success' ? <Check className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                                <span className="text-sm">{message}</span>
                            </div>
                        )}

                        {currentDomain && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                                <h4 className="font-bold text-sm text-blue-900">DNS設定手順</h4>
                                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                    <li>ドメインのDNS設定画面を開く</li>
                                    <li>CNAMEレコードを追加: <code className="bg-blue-100 px-1 rounded">{currentDomain} → cname.vercel-dns.com</code></li>
                                    <li>設定反映まで最大48時間お待ちください</li>
                                </ol>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
