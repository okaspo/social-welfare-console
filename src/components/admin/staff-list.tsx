'use client'

import { useState } from 'react'
import { AdminStaff, addAdminStaff, removeAdminStaff, updateAdminRole } from '@/lib/actions/admin-staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Shield, Loader2, Plus } from 'lucide-react'

interface StaffListProps {
    initialStaff: AdminStaff[]
    currentUserRole: string
}

export default function StaffList({ initialStaff, currentUserRole }: StaffListProps) {
    const [staff, setStaff] = useState(initialStaff)
    const [isLoading, setIsLoading] = useState(false)
    const [open, setOpen] = useState(false)

    // Form State
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'super_admin' | 'editor'>('editor')

    const isSuperAdmin = currentUserRole === 'super_admin'

    const handleAdd = async () => {
        setIsLoading(true)
        const res = await addAdminStaff(email, role)
        if (res.error) {
            alert(res.error)
        } else {
            setOpen(false)
            setEmail('')
            // Ideally revalidatePath handles this, or we refresh via router. refresh() done in action.
            window.location.reload()
        }
        setIsLoading(false)
    }

    const handleRemove = async (userId: string) => {
        if (!confirm('本当にこのユーザーの管理者権限を剥奪しますか？')) return
        const res = await removeAdminStaff(userId)
        if (res.error) alert(res.error)
        else window.location.reload()
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        const res = await updateAdminRole(userId, newRole as any)
        if (res.error) alert(res.error)
        else window.location.reload()
    }

    return (
        <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-700">スタッフ一覧 ({staff.length})</h3>

                {isSuperAdmin && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                                <Plus className="w-4 h-4 mr-1" />
                                スタッフ招待
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>管理者を追加</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">メールアドレス</label>
                                    <Input
                                        placeholder="user@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500">※既にシステムに登録済みのユーザーのみ追加可能です</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">権限ロール</label>
                                    <Select value={role} onValueChange={(v: any) => setRole(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="editor">Editor (一般管理者)</SelectItem>
                                            <SelectItem value="super_admin">Super Admin (特権管理者)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    className="w-full bg-gray-900"
                                    onClick={handleAdd}
                                    disabled={isLoading || !email}
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    権限を付与
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Added At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {staff.map(member => (
                            <tr key={member.user_id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium">{member.name || 'No Name'}</div>
                                    <div className="text-gray-500 text-xs">{member.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${member.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        <Shield className="w-3 h-3" />
                                        {member.role === 'super_admin' ? 'Super Admin' : 'Editor'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {new Date(member.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {isSuperAdmin && (
                                        <div className="flex justify-end gap-2">
                                            {member.role !== 'super_admin' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-500 hover:text-purple-600"
                                                    onClick={() => handleRoleChange(member.user_id, 'super_admin')}
                                                >
                                                    Promote
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-500 hover:text-blue-600"
                                                    onClick={() => handleRoleChange(member.user_id, 'editor')}
                                                >
                                                    Demote
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleRemove(member.user_id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
