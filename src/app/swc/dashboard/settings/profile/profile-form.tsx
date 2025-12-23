'use client'

import { useState } from 'react'
import { updateProfile } from '@/lib/actions/profile'
import { User } from 'lucide-react'

interface ProfileData {
    full_name: string | null
    job_title: string | null
    age_group: string | null
    gender: string | null
}

export default function ProfileSettingsForm({ profile }: { profile: ProfileData | null }) {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(formData: FormData) {
        setError(null)
        setSuccess(false)

        const result = await updateProfile(formData)

        if (result.error) {
            setError(result.error)
        } else {
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        }
    }

    return (
        <div className="max-w-3xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">プロフィール設定</h1>
                </div>
                <p className="text-sm text-gray-600">
                    ここで設定した情報は、葵さんの接し方に反映されます
                </p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                    ✓ プロフィールを更新しました
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    {error}
                </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <form action={handleSubmit} className="space-y-6">
                    {/* Display Name */}
                    <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                            表示名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            defaultValue={profile?.full_name || ''}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="例: 田中 太郎"
                        />
                    </div>

                    {/* Job Title */}
                    <div>
                        <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-2">
                            役職
                        </label>
                        <input
                            type="text"
                            id="job_title"
                            name="job_title"
                            defaultValue={profile?.job_title || ''}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="例: 理事長、事務長、職員"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            葵さんがあなたの立場に応じた対応をします
                        </p>
                    </div>

                    {/* Age Group */}
                    <div>
                        <label htmlFor="age_group" className="block text-sm font-medium text-gray-700 mb-2">
                            年代 <span className="text-gray-400 text-xs">(任意)</span>
                        </label>
                        <select
                            id="age_group"
                            name="age_group"
                            defaultValue={profile?.age_group || ''}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                        >
                            <option value="">選択しない</option>
                            <option value="20s">20代</option>
                            <option value="30s">30代</option>
                            <option value="40s">40代</option>
                            <option value="50s">50代</option>
                            <option value="60s+">60代以上</option>
                        </select>
                    </div>

                    {/* Gender */}
                    <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                            性別 <span className="text-gray-400 text-xs">(任意)</span>
                        </label>
                        <select
                            id="gender"
                            name="gender"
                            defaultValue={profile?.gender || ''}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                        >
                            <option value="">選択しない</option>
                            <option value="male">男性</option>
                            <option value="female">女性</option>
                            <option value="other">その他</option>
                            <option value="no_answer">回答しない</option>
                        </select>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                            保存する
                        </button>
                    </div>
                </form>
            </div>

            {/* Info Card */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">💡 プロフィール情報の活用について</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                    <li>• 若手職員には丁寧にステップバイステップで説明します</li>
                    <li>• 理事長など役員の方には結論ファーストで簡潔に対応します</li>
                    <li>• 事務長など管理職の方には協力的な同僚として接します</li>
                    <li>• すべての情報は任意です。設定しなくても利用できます</li>
                </ul>
            </div>
        </div>
    )
}
