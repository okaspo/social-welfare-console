'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Lock, Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SecuritySettings() {
    const [isLoading, setIsLoading] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            alert('パスワードが一致しません')
            return
        }
        if (newPassword.length < 6) {
            alert('パスワードは6文字以上で設定してください')
            return
        }

        setIsLoading(true)
        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        setIsLoading(false)

        if (error) {
            alert(error.message)
        } else {
            alert('パスワードを変更しました')
            setNewPassword('')
            setConfirmPassword('')
        }
    }

    return (
        <div className="bg-white border text-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2 text-lg">
                    <Lock className="h-5 w-5 text-gray-500" />
                    セキュリティ
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 max-w-md space-y-4">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">新しいパスワード</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">新しいパスワード（確認）</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <div className="pt-2">
                    <Button type="submit" disabled={isLoading} className="bg-indigo-600 text-white hover:bg-indigo-700 w-full md:w-auto">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        パスワードを変更
                    </Button>
                </div>
            </form>
        </div>
    )
}
