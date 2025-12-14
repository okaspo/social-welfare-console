'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch' // standard shadcn
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { managePrice, deletePrice } from '@/lib/actions/billing'
import { Loader2, Trash2, Edit2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type Price = {
    id: string
    plan_id: string
    amount: number
    interval: 'month' | 'year'
    is_public: boolean
    campaign_code: string | null
}

type Plan = {
    plan_id: string
    name: string
}

export default function PriceManager({ plans, prices }: { plans: Plan[], prices: Price[] }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [editingPrice, setEditingPrice] = useState<Price | null>(null)

    // Form State (Default)
    const defaultFormState = {
        planId: 'STANDARD',
        amount: 2000,
        interval: 'month' as 'month' | 'year',
        isPublic: true,
        campaignCode: ''
    }
    const [formState, setFormState] = useState(defaultFormState)

    const openCreate = () => {
        setEditingPrice(null)
        setFormState(defaultFormState)
        setIsDialogOpen(true)
    }

    const openEdit = (price: Price) => {
        setEditingPrice(price)
        setFormState({
            planId: price.plan_id,
            amount: price.amount,
            interval: price.interval as 'month' | 'year',
            isPublic: price.is_public,
            campaignCode: price.campaign_code || ''
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData()
        if (editingPrice) formData.append('id', editingPrice.id)
        formData.append('planId', formState.planId)
        formData.append('amount', formState.amount.toString())
        formData.append('interval', formState.interval)
        formData.append('isPublic', formState.isPublic.toString())
        formData.append('campaignCode', formState.campaignCode)

        const result = await managePrice(formData)
        setIsLoading(false)
        if (result.error) {
            alert(result.error)
        } else {
            setIsDialogOpen(false)
            setFormState(defaultFormState)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('本当に削除しますか？')) return
        await deletePrice(id)
    }

    const getPlanName = (id: string) => plans.find(p => p.plan_id === id)?.name || id

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Price Configuration</h2>
                <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Add Price
                </Button>
            </div>

            <div className="bg-white rounded-md border text-gray-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b font-medium text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Plan</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Interval</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Campaign Code</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {prices.map((price) => (
                            <tr key={price.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{getPlanName(price.plan_id)}</td>
                                <td className="px-4 py-3">¥{price.amount.toLocaleString()}</td>
                                <td className="px-4 py-3 capitalize">{price.interval}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${price.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {price.is_public ? 'Public' : 'Hidden'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">{price.campaign_code || '-'}</td>
                                <td className="px-4 py-3 text-right flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(price)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(price.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPrice ? 'Edit Price' : 'New Price'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Target Plan</Label>
                            <Select
                                value={formState.planId}
                                onValueChange={(v) => setFormState({ ...formState, planId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map(p => (
                                        <SelectItem key={p.plan_id} value={p.plan_id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Amount (JPY)</Label>
                                <Input
                                    type="number"
                                    value={formState.amount}
                                    onChange={(e) => setFormState({ ...formState, amount: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Interval</Label>
                                <Select
                                    value={formState.interval}
                                    onValueChange={(v) => setFormState({ ...formState, interval: v as 'month' | 'year' })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="month">Monthly</SelectItem>
                                        <SelectItem value="year">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Campaign Code (Optional)</Label>
                            <Input
                                placeholder="e.g. EARLY_BIRD"
                                value={formState.campaignCode}
                                onChange={(e) => setFormState({ ...formState, campaignCode: e.target.value })}
                            />
                            <p className="text-xs text-gray-500">If set, users must use ?promo=CODE to see this price.</p>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <Label className="cursor-pointer" htmlFor="isPublic">Public Visibility</Label>
                            <Switch
                                id="isPublic"
                                checked={formState.isPublic}
                                onCheckedChange={(c) => setFormState({ ...formState, isPublic: c })}
                            />
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white">
                            {isLoading ? <Loader2 className="animate-spin" /> : (editingPrice ? 'Update Price' : 'Create Price')}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
