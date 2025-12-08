'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [fullName, setFullName] = useState('')
    const [corporationName, setCorporationName] = useState('')
    const [message, setMessage] = useState('')
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, corporation_name')
                .eq('id', user.id)
                .single()

            if (profile) {
                setFullName(profile.full_name || '')
                setCorporationName(profile.corporation_name || '')
            }
            setLoading(false)
        }

        fetchProfile()
    }, [router, supabase])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setUpdating(true)
        setMessage('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: fullName,
                corporation_name: corporationName,
                updated_at: new Date().toISOString()
            })

        if (error) {
            setMessage('更新に失敗しました: ' + error.message)
        } else {
            setMessage('プロフィールを更新しました')
            router.refresh()
        }
        setUpdating(false)
    }

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">設定</h1>
                <p className="text-gray-500 text-sm mt-1">
                    アカウント情報や法人設定の管理。
                </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900">基本情報</h2>
                    <p className="text-sm text-gray-500">
                        システム全体で使用されるあなたの基本情報です。
                    </p>
                </div>
                <div className="p-6">
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                                    氏名
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="corporationName" className="text-sm font-medium text-gray-700">
                                    法人名
                                </label>
                                <input
                                    id="corporationName"
                                    type="text"
                                    value={corporationName}
                                    onChange={(e) => setCorporationName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                />
                                <p className="text-xs text-gray-500">
                                    ※議事録などの書類に自動反映されます。
                                </p>
                            </div>
                        </div>

                        {message && (
                            <div className={`p-3 rounded-md text-sm ${message.includes('失敗') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {message}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={updating}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                保存する
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
