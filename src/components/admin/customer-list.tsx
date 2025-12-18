'use client'

import { useState } from 'react'
import { CustomerOrg, updateOrgPlan } from '@/lib/actions/admin-customers'
import { Button } from '@/components/ui/button'
import { Search, Building2, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CustomerListProps {
    initialOrgs: CustomerOrg[]
}

export default function CustomerList({ initialOrgs }: CustomerListProps) {
    const [orgs, setOrgs] = useState(initialOrgs)
    const [search, setSearch] = useState('')

    const filteredOrgs = orgs.filter(o =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.entity_type.toLowerCase().includes(search.toLowerCase())
    )

    const handlePlanChange = async (orgId: string, newPlan: string) => {
        if (!confirm(`プランを ${newPlan} に変更しますか？`)) return
        const res = await updateOrgPlan(orgId, newPlan)
        if (res.error) alert(res.error)
        else {
            // Basic reload for now
            window.location.reload()
        }
    }

    return (
        <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="法人名で検索..."
                        className="pl-9 bg-white"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500 ml-auto">
                    Total: <span className="font-bold">{filteredOrgs.length}</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
                        <tr>
                            <th className="px-6 py-3">Organization</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Plan</th>
                            <th className="px-6 py-3">Registered</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredOrgs.map(org => (
                            <tr key={org.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                        {org.name}
                                    </div>
                                    {org.custom_domain && (
                                        <div className="text-xs text-indigo-500 mt-1">{org.custom_domain}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                        {org.entity_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Select
                                        defaultValue={org.plan}
                                        onValueChange={(val) => handlePlanChange(org.id, val)}
                                    >
                                        <SelectTrigger className="w-[120px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free">Free</SelectItem>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    {new Date(org.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="outline" size="sm" className="h-8">
                                        詳細
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
