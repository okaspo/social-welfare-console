'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Bell, Loader2 } from 'lucide-react'

export default function NotificationSettings() {
    // Mock state for now
    const [settings, setSettings] = useState({
        news: true,
        security: true,
        updates: false
    })

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
        // In a real app, this would trigger an API call
    }

    return (
        <div className="bg-white border text-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2 text-lg">
                    <Bell className="h-5 w-5 text-gray-500" />
                    通知設定
                </h2>
            </div>

            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-bold block">重要なお知らせ</label>
                        <p className="text-xs text-gray-500">サービスに関する重要な変更やメンテナンス情報（オフにできません）</p>
                    </div>
                    <Switch checked={true} disabled />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-bold block">セキュリティ通知</label>
                        <p className="text-xs text-gray-500">ログイン通知やパスワード変更時のお知らせ</p>
                    </div>
                    <Switch checked={settings.security} onCheckedChange={() => handleToggle('security')} />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-bold block">新機能・アップデート</label>
                        <p className="text-xs text-gray-500">新しい機能や改善に関する情報を受け取る</p>
                    </div>
                    <Switch checked={settings.news} onCheckedChange={() => handleToggle('news')} />
                </div>
            </div>
        </div>
    )
}
