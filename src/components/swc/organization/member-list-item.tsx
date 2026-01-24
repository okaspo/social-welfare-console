'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil, Save, X, Loader2 } from 'lucide-react'
import { updateProfile } from '@/lib/actions/organization'

type Member = {
    id: string
    full_name: string | null
    email?: string
    role: string
    created_at: string
}


import { removeMember } from '@/lib/actions/organization'
import { Trash2 } from 'lucide-react'

export default function MemberListItem({ member, isCurrentUser, currentUserRole }: { member: Member, isCurrentUser: boolean, currentUserRole?: string }) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState(member.full_name || '')

    const handleSave = async () => {
        if (!name.trim()) return

        setIsLoading(true)
        const formData = new FormData()
        formData.append('fullName', name)

        const res = await updateProfile(formData)
        setIsLoading(false)

        if (res.error) {
            alert(res.error)
        } else {
            setIsEditing(false)
        }
    }

    const handleRemove = async () => {
        if (!confirm(`${member.full_name || 'このメンバー'} を組織から削除しますか？\nこの操作は取り消せません。`)) return

        setIsLoading(true)
        const res = await removeMember(member.id)
        setIsLoading(false)

        if (res.error) {
            alert(res.error)
        }
    }

    const canRemove = (currentUserRole === 'admin' || currentUserRole === 'representative') && !isCurrentUser

    if (isEditing) {
        return (
            <tr className="bg-indigo-50/50">
                <td className="px-6 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="px-2 py-1 border rounded text-sm w-full max-w-[200px]"
                            autoFocus
                        />
                    </div>
                </td>
                <td className="px-6 py-3">
                    <span className="opacity-50">ー</span>
                </td>
                <td className="px-6 py-3">
                    <span className="opacity-50">ー</span>
                </td>
                <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-600" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </td>
            </tr>
        )
    }

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-3 font-medium text-gray-900">
                {member.full_name || '名称未設定'}
                {isCurrentUser && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">YOU</span>}
            </td>
            <td className="px-6 py-3">
                {(member.role === 'admin' || member.role === 'representative') ?
                    <span className="text-indigo-600 font-medium">管理者</span> :
                    <span>一般</span>
                }
            </td>
            <td className="px-6 py-3">{new Date(member.created_at).toLocaleDateString('ja-JP')}</td>
            <td className="px-6 py-3 text-right">
                <div className="flex justify-end items-center gap-2">
                    {isCurrentUser ? (
                        <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 text-xs">
                            <Pencil className="h-3.5 w-3.5" /> 編集
                        </button>
                    ) : (
                        <>
                            {canRemove && (
                                <button
                                    onClick={handleRemove}
                                    disabled={isLoading}
                                    className="text-gray-400 hover:text-red-600 transition-colors inline-flex items-center gap-1 text-xs mr-2"
                                    title="組織から削除"
                                >
                                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    削除
                                </button>
                            )}
                            <button className="text-gray-400 hover:text-indigo-600 text-xs">詳細</button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    )
}

