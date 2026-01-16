'use client'

import { useState } from 'react'
import { Plus, Trash2, Building2, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { addConcurrentPost, deleteConcurrentPost, ConcurrentPost } from '@/app/swc/dashboard/officers/[id]/actions'
import { toast } from 'sonner'

export default function ConcurrentPostsManager({
    officerId,
    initialPosts
}: {
    officerId: string
    initialPosts: ConcurrentPost[]
}) {
    const [posts, setPosts] = useState<ConcurrentPost[]>(initialPosts)
    const [isOpen, setIsOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSubmitting(true)
        const formData = new FormData(event.currentTarget)

        const result = await addConcurrentPost(officerId, formData)

        if (result.error) {
            toast.error('登録に失敗しました: ' + result.error)
        } else {
            toast.success('兼職情報を登録しました')
            setIsOpen(false)
            // Ideally we re-fetch or rely on server revalidation + router refresh.
            // For client state speed, we could optimistic update, but revalidation via router is cleaner in Next app router if available props update.
            // Since this is a client component receiving props, we might need to router.refresh()
            location.reload() // Simple brute force for prototype, ideally use useRouter().refresh()
        }
        setIsSubmitting(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('この兼職情報を削除してもよろしいですか？')) return

        const result = await deleteConcurrentPost(id, officerId)
        if (result.error) {
            toast.error('削除に失敗しました')
        } else {
            toast.success('削除しました')
            setPosts(posts.filter(p => p.id !== id))
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gray-500" />
                    兼職状況
                </h3>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-gray-900 text-white">
                            <Plus className="h-4 w-4 mr-1" />
                            兼職を追加
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>兼職情報の追加</DialogTitle>
                            <DialogDescription>
                                他の法人での役職や職業について入力してください。
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="org">法人名・会社名</Label>
                                <Input id="org" name="organization_name" required placeholder="例: 株式会社ホゲホゲ" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="post">役職名</Label>
                                <Input id="post" name="post_name" required placeholder="例: 代表取締役" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start">就任日</Label>
                                    <Input id="start" name="start_date" type="date" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end">退任日 (予定)</Label>
                                    <Input id="end" name="end_date" type="date" />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="paid" name="is_paid" />
                                <Label htmlFor="paid">報酬等の受給あり</Label>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="comp">月額報酬 (概算)</Label>
                                <Input id="comp" name="monthly_compensation" type="number" placeholder="0" />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? '保存中...' : '保存'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                {posts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        登録されている兼職情報はありません。
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b">
                            <tr>
                                <th className="px-4 py-2">法人名</th>
                                <th className="px-4 py-2">役職</th>
                                <th className="px-4 py-2">期間</th>
                                <th className="px-4 py-2">報酬</th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {posts.map(post => (
                                <tr key={post.id}>
                                    <td className="px-4 py-3 font-medium">{post.organization_name}</td>
                                    <td className="px-4 py-3">{post.post_name}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {post.start_date} ~ {post.end_date || '現在'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {post.is_paid ? 'あり' : 'なし'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 flex items-start gap-2">
                <Building2 className="h-5 w-5 shrink-0" />
                <div>
                    <strong>兼職要件の確認</strong><br />
                    社会福祉法人の理事は、評議員との兼職が禁止されています。また、監事は理事・評議員・職員との兼職が禁止されています。
                    このリストは、所轄庁への届出や「現況報告書」の作成時に使用されます。
                </div>
            </div>
        </div>
    )
}
