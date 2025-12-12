'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Copy, Check } from 'lucide-react'
import { createMember } from '@/lib/actions/organization'

export default function AddMemberModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [result, setResult] = useState<{ email?: string, tempPassword?: string, error?: string } | null>(null)

    const handleSubmit = async (formData: FormData) => {
        setStatus('loading')
        const res = await createMember(formData)

        if (res.error) {
            setResult({ error: res.error })
            setStatus('error')
        } else {
            setResult(res)
            setStatus('success')
        }
    }

    const reset = () => {
        setIsOpen(false)
        setStatus('idle')
        setResult(null)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    メンバー追加
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>新規メンバー招待</DialogTitle>
                </DialogHeader>

                {status === 'success' ? (
                    <div className="space-y-4 py-4">
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
                            <h3 className="font-bold flex items-center gap-2 mb-2">
                                <Check className="h-4 w-4" />
                                メンバーを作成しました
                            </h3>
                            <p>仮パスワードをコピーして、招待するメンバーに共有してください。</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500">ログインEmail</label>
                            <div className="p-2 bg-gray-50 border rounded font-mono text-sm">{result?.email}</div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500">仮パスワード</label>
                            <div className="flex gap-2">
                                <div className="flex-1 p-2 bg-gray-100 border border-gray-300 rounded font-mono text-lg tracking-wider text-center font-bold">
                                    {result?.tempPassword}
                                </div>
                                <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(result?.tempPassword || '')}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-red-500">※ この画面を閉じるとパスワードは再表示できません。</p>
                        </div>

                        <Button onClick={reset} className="w-full">閉じる</Button>
                    </div>
                ) : (
                    <form action={handleSubmit} className="space-y-4 py-4">
                        {status === 'error' && (
                            <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
                                {result?.error || 'エラーが発生しました'}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="fullName" className="text-sm font-medium">氏名</label>
                            <input
                                name="fullName"
                                required
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="鈴木 花子"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">メールアドレス</label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="hanako@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="role" className="text-sm font-medium">権限</label>
                            <select
                                name="role"
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            >
                                <option value="general">一般メンバー</option>
                                <option value="admin">管理者</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>キャンセル</Button>
                            <Button type="submit" disabled={status === 'loading'} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                作成する
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
