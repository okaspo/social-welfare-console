'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save, Loader2, Building2, Info } from 'lucide-react'
import { updateOrganization } from '@/lib/actions/organization'

type EntityType = 'social_welfare' | 'npo' | 'medical_corp' | 'general_inc'

type OrgData = {
    name: string
    plan: string
    address: string | null
    phone: string | null
    establishment_date: string | null
    entity_type?: EntityType | null
}

const ENTITY_TYPES: { value: EntityType; label: string; description: string }[] = [
    { value: 'social_welfare', label: '社会福祉法人', description: '社会福祉法に基づく法人' },
    { value: 'npo', label: 'NPO法人', description: '特定非営利活動促進法に基づく法人' },
    { value: 'medical_corp', label: '医療法人', description: '医療法に基づく法人' },
    { value: 'general_inc', label: '一般社団法人', description: '一般社団法人法に基づく法人' },
]

export default function OrgEditForm({ initialData }: { initialData: OrgData }) {
    const [isLoading, setIsLoading] = useState(false)
    const [entityType, setEntityType] = useState<EntityType>(initialData.entity_type || 'social_welfare')

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        formData.set('entity_type', entityType)
        const res = await updateOrganization(formData)
        setIsLoading(false)

        if (res.error) {
            alert(res.error)
        } else {
            alert('組織情報を保存しました')
        }
    }

    const selectedEntityInfo = ENTITY_TYPES.find(e => e.value === entityType)

    return (
        <div className="bg-white border text-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    組織情報
                </h2>
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-bold border border-indigo-200">
                    {initialData.plan} PLAN
                </span>
            </div>

            <div className="p-6">
                <form action={handleSubmit} className="space-y-6">
                    {/* Entity Type Selector */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                            法人種別
                            <Info className="h-3 w-3 text-gray-400" />
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {ENTITY_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setEntityType(type.value)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${entityType === type.value
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                        }`}
                                >
                                    <div className="font-bold text-sm">{type.label}</div>
                                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{type.description}</div>
                                </button>
                            ))}
                        </div>
                        {selectedEntityInfo && (
                            <p className="text-xs text-gray-500">
                                選択中: <span className="font-medium">{selectedEntityInfo.label}</span> - {selectedEntityInfo.description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">法人名</label>
                            <input
                                name="name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                defaultValue={initialData.name}
                                placeholder="社会福祉法人〇〇会"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">電話番号</label>
                            <input
                                name="phone"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                defaultValue={initialData.phone || ''}
                                placeholder="03-1234-5678"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">住所</label>
                            <input
                                name="address"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                defaultValue={initialData.address || ''}
                                placeholder="東京都千代田区..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase">設立日</label>
                            <input
                                name="establishmentDate"
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                defaultValue={initialData.establishment_date || ''}
                            />
                        </div>
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
