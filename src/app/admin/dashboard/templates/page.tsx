'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react'

// Define the Template interface
interface DocumentTemplate {
    id: string
    name: string
    description: string
    content: string
    category: string
    is_active: boolean
    created_at: string
}

export default function TemplatesPage() {
    const supabase = createClient()
    const [templates, setTemplates] = useState<DocumentTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    // Form state
    const [formData, setFormData] = useState<Partial<DocumentTemplate>>({})
    const [saveLoading, setSaveLoading] = useState(false)

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('document_templates')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setTemplates(data)
        if (error) console.error('Error fetching templates:', error)
        setLoading(false)
    }

    const handleEdit = (template: DocumentTemplate) => {
        setSelectedTemplate(template)
        setFormData(template)
        setIsEditing(true)
    }

    const handleCreate = () => {
        setSelectedTemplate(null)
        setFormData({
            name: '',
            description: '',
            content: '',
            category: 'agenda',
            is_active: true
        })
        setIsEditing(true)
    }

    const handleSave = async () => {
        setSaveLoading(true)
        try {
            if (selectedTemplate) {
                // Update
                const { error } = await supabase
                    .from('document_templates')
                    .update({
                        name: formData.name,
                        description: formData.description,
                        content: formData.content,
                        category: formData.category,
                        is_active: formData.is_active,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', selectedTemplate.id)

                if (error) throw error
            } else {
                // Create
                const { error } = await supabase
                    .from('document_templates')
                    .insert({
                        name: formData.name!,
                        description: formData.description,
                        content: formData.content!,
                        category: formData.category!,
                        is_active: true
                    })

                if (error) throw error
            }

            setIsEditing(false)
            fetchTemplates()
        } catch (error: any) {
            alert('Error saving template: ' + error.message)
        } finally {
            setSaveLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">ドキュメントテンプレート管理</h1>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    新規テンプレート
                </button>
            </div>

            {isEditing ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-lg font-bold text-gray-800">
                            {selectedTemplate ? 'テンプレート編集' : '新規テンプレート作成'}
                        </h2>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">テンプレート名</label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="例：議事録作成プロンプト ver4.7"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                            <select
                                value={formData.category || 'agenda'}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="agenda">議案書・議事録</option>
                                <option value="minutes">議事録のみ</option>
                                <option value="contract">契約書</option>
                                <option value="other">その他</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                        <input
                            type="text"
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="機能の概要など"
                        />
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">コンテンツ（プロンプト）</label>
                        <textarea
                            value={formData.content || ''}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="AIへの指示（プロンプト）を入力してください..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saveLoading || !formData.name || !formData.content}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            保存する
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="テンプレートを検索..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">読み込み中...</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {templates.map(template => (
                                <div key={template.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-start group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${template.category === 'agenda' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                    template.category === 'minutes' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}>
                                                {template.category === 'agenda' ? '議案書' : template.category === 'minutes' ? '議事録' : 'その他'}
                                            </span>
                                            <h3 className="font-bold text-gray-900">{template.name}</h3>
                                            {!template.is_active && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">無効</span>}
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {templates.length === 0 && (
                                <div className="p-8 text-center text-gray-400">
                                    テンプレートがありません。新規作成してください。
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
