'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save, User, Loader2 } from 'lucide-react'
import { updateProfile } from '@/lib/actions/organization'

type ProfileData = {
    fullName: string
    email?: string
}

export default function ProfileEditForm({ initialData }: { initialData: ProfileData }) {
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        const res = await updateProfile(formData)
        setIsLoading(false)

        if (res.error) {
            alert(res.error)
        } else {
            alert('プロフィールを保存しました')
        }
    }

    return (
        <div className="bg-white border text-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-gray-500" />
                    個人設定
                </h2>
                <div className="text-xs text-gray-400 font-mono">
                    {initialData.email}
                </div>
            </div>

            <div className="p-6">
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2 max-w-md">
                        <label className="text-xs font-semibold text-gray-500 uppercase">氏名</label>
                        <input
                            name="fullName"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            defaultValue={initialData.fullName}
                            placeholder="山田 太郎"
                            required
                        />
                        <p className="text-xs text-gray-400">※ 他のメンバーにもこの名前で表示されます。</p>
                    </div>

                    <div className="pt-4 flex justify-end border-t mt-4">
                        <Button type="submit" disabled={isLoading} className="bg-indigo-600 text-white hover:bg-indigo-700 min-w-[120px]">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            変更を保存
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
