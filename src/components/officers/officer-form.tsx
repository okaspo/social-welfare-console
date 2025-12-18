'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOfficer, updateOfficer } from '@/app/dashboard/officers/[id]/actions'
import { Loader2 } from 'lucide-react'

type OfficerFormProps = {
    officer?: any // Replace with proper type if available
    isEdit?: boolean
    onSuccess?: () => void
}

export default function OfficerForm({ officer, isEdit = false, onSuccess }: OfficerFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)

        try {
            let result;
            if (isEdit && officer?.id) {
                result = await updateOfficer(officer.id, formData)
            } else {
                result = await createOfficer(formData)
            }

            if (result?.error) {
                setError(result.error)
            } else {
                router.refresh()
                if (onSuccess) onSuccess()
            }
        } catch (e: any) {
            setError(e.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">氏名 <span className="text-red-500">*</span></label>
                    <input
                        name="name"
                        required
                        defaultValue={officer?.name}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="山田 太郎"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">役職 <span className="text-red-500">*</span></label>
                    <select
                        name="role"
                        required
                        defaultValue={officer?.role || 'director'}
                        className="w-full px-3 py-2 border rounded-md"
                    >
                        <option value="director">理事</option>
                        <option value="auditor">監事</option>
                        <option value="councilor">評議員</option>
                        <option value="selection_committee">選任解任委員</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">任期開始日 <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        name="term_start_date"
                        required
                        defaultValue={officer?.term_start_date?.split('T')[0]}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">任期満了日 <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        name="term_end_date"
                        required
                        defaultValue={officer?.term_end_date?.split('T')[0]}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">メールアドレス</label>
                <input
                    type="email"
                    name="email"
                    defaultValue={officer?.email}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="taro@example.com"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">専門性タグ (カンマ区切り)</label>
                <input
                    name="expertise_tags"
                    defaultValue={officer?.expertise_tags?.join(', ')}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="財務, 法務, 社会福祉"
                />
                <p className="text-xs text-gray-500">
                    例: 財務, 法務, 医療経営, 地域福祉 (バランスチェックに使用されます)
                </p>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isEdit ? '更新する' : '登録する'}
                </button>
            </div>
        </form>
    )
}
