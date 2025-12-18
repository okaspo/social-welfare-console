'use client'

import { useState } from 'react'
import { CustomerOrg, updateOrganizationAdmin } from '@/lib/actions/admin-customers'
import { Button } from '@/components/ui/button'
import { Search, Building2, ExternalLink, Edit2, Loader2, User, Mail, Calendar, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface CustomerListProps {
    initialOrgs: CustomerOrg[]
}

export default function CustomerList({ initialOrgs }: CustomerListProps) {
    const [orgs, setOrgs] = useState(initialOrgs)
    const [search, setSearch] = useState('')

    // Edit Modal State
    const [editingOrg, setEditingOrg] = useState<CustomerOrg | null>(null)
    const [editName, setEditName] = useState('')
    const [editPlan, setEditPlan] = useState('')
    const [editStatus, setEditStatus] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const filteredOrgs = orgs.filter(o =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.entity_type.toLowerCase().includes(search.toLowerCase()) ||
        (o.owner_email || '').toLowerCase().includes(search.toLowerCase())
    )

    const openEditModal = (org: CustomerOrg) => {
        setEditingOrg(org)
        setEditName(org.name)
        setEditPlan(org.plan)
        setEditStatus(org.status || 'active')
    }

    const handleSave = async () => {
        if (!editingOrg) return
        setIsLoading(true)
        const res = await updateOrganizationAdmin(editingOrg.id, {
            name: editName,
            plan: editPlan,
            status: editStatus
        })
        setIsLoading(false)

        if (res.error) {
            alert(res.error)
        } else {
            // Optimistic update or reload
            // Ideally we re-fetch, but for now we reload or update local state partially
            alert('更新しました')
            window.location.reload()
        }
    }

    return (
        <div className="bg-white border rounded-lg shadow-sm">
            {/* Header / Search */}
            <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="法人名、代表者、Emailで検索..."
                        className="pl-9 bg-white"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500 ml-auto flex items-center gap-2">
                    <span className="bg-white border px-2 py-1 rounded shadow-sm">
                        Total: <span className="font-bold text-gray-900">{filteredOrgs.length}</span>
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-3 min-w-[200px]">Organization</th>
                            <th className="px-6 py-3 min-w-[200px]">Representative</th>
                            <th className="px-6 py-3">Plan</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Usage</th>
                            <th className="px-6 py-3">Last Active</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrgs.map(org => (
                            <tr key={org.id} className="hover:bg-gray-50/50 transition-colors">
                                {/* Organization */}
                                <td className="px-6 py-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{org.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{org.entity_type}</div>
                                            {org.custom_domain && (
                                                <div className="text-xs text-indigo-600 mt-1 flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                                                    <ExternalLink className="w-3 h-3" />
                                                    {org.custom_domain}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Representative */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                            {org.owner_name}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Mail className="w-3.5 h-3.5" />
                                            {org.owner_email}
                                        </div>
                                    </div>
                                </td>

                                {/* Plan */}
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className={`
                                        uppercase font-bold tracking-wider text-[10px] px-2 py-0.5
                                        ${org.plan === 'enterprise' ? 'border-purple-200 bg-purple-50 text-purple-700' :
                                            org.plan === 'pro' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                                org.plan === 'standard' ? 'border-green-200 bg-green-50 text-green-700' :
                                                    'border-gray-200 bg-gray-50 text-gray-600'}
                                    `}>
                                        {org.plan}
                                    </Badge>
                                </td>

                                {/* Status */}
                                <td className="px-6 py-4">
                                    <Badge variant={org.status === 'active' ? 'default' : 'destructive'} className="text-[10px] px-2 py-0.5 h-5">
                                        {org.status || 'Active'}
                                    </Badge>
                                </td>

                                {/* Usage */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="font-medium text-gray-900">{org.member_count}</span>
                                        <span className="text-gray-400">members</span>
                                    </div>
                                </td>

                                {/* Activity */}
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        {org.last_sign_in_at ? new Date(org.last_sign_in_at).toLocaleDateString() : '-'}
                                    </div>
                                </td>

                                {/* Action */}
                                <td className="px-6 py-4 text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 hover:bg-gray-100"
                                        onClick={() => openEditModal(org)}
                                    >
                                        <Edit2 className="w-4 h-4 text-gray-500" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            <Dialog open={!!editingOrg} onOpenChange={(open) => !open && setEditingOrg(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>組織情報の編集</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">法人名</label>
                            <Input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">プラン</label>
                                <Select value={editPlan} onValueChange={setEditPlan}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="standard">Standard</SelectItem>
                                        <SelectItem value="pro">Pro</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">ステータス</label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active (有効)</SelectItem>
                                        <SelectItem value="suspended">Suspended (停止)</SelectItem>
                                        <SelectItem value="canceled">Canceled (解約)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingOrg(null)}>
                            キャンセル
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading} className="bg-gray-900 text-white">
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            変更を保存
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
