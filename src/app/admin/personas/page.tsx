'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Edit, Save, X, Upload } from 'lucide-react';

interface Persona {
    id: string;
    code: string;
    name: string;
    entity_type: string | null;
    description: string | null;
    avatar_url: string | null;
    full_body_url: string | null;
    tone_prompt: string | null;
}

const ENTITY_TYPES = [
    { value: 'social_welfare', label: '社会福祉法人', color: 'bg-blue-100 text-blue-700' },
    { value: 'npo', label: 'NPO法人', color: 'bg-green-100 text-green-700' },
    { value: 'medical_corp', label: '医療法人', color: 'bg-purple-100 text-purple-700' },
];

export default function PersonasPage() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Persona>>({});
    const supabase = createClient();

    useEffect(() => {
        fetchPersonas();
    }, []);

    const fetchPersonas = async () => {
        const { data } = await supabase
            .from('assistant_profiles')
            .select('*')
            .order('code');

        if (data) setPersonas(data);
        setLoading(false);
    };

    const startEdit = (persona: Persona) => {
        setEditingId(persona.id);
        setEditForm(persona);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        if (!editingId) return;

        await supabase
            .from('assistant_profiles')
            .update({
                name: editForm.name,
                entity_type: editForm.entity_type,
                description: editForm.description,
                avatar_url: editForm.avatar_url,
                full_body_url: editForm.full_body_url,
                tone_prompt: editForm.tone_prompt,
            })
            .eq('id', editingId);

        setEditingId(null);
        setEditForm({});
        fetchPersonas();
    };

    const getEntityBadge = (entityType: string | null) => {
        const entity = ENTITY_TYPES.find(e => e.value === entityType);
        if (!entity) return null;
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${entity.color}`}>
                {entity.label}
            </span>
        );
    };

    if (loading) {
        return <div className="p-10 text-center">読み込み中...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-indigo-600" />
                    ペルソナ管理
                </h1>
                <p className="text-gray-500 mt-1">
                    AIアシスタントのペルソナを法人タイプ別に管理します
                </p>
            </div>

            <div className="grid gap-6">
                {personas.map(persona => (
                    <div
                        key={persona.id}
                        className="bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                        {editingId === persona.id ? (
                            // Edit Mode
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={editForm.avatar_url || '/assets/avatars/aoi_face_icon.jpg'}
                                            alt={persona.name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                        />
                                        <div>
                                            <input
                                                type="text"
                                                value={editForm.name || ''}
                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                className="text-xl font-bold border rounded px-2 py-1"
                                            />
                                            <div className="text-sm text-gray-500">{persona.code}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={saveEdit}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            <Save className="h-4 w-4" />
                                            保存
                                        </button>
                                        <button
                                            onClick={cancelEdit}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                        >
                                            <X className="h-4 w-4" />
                                            キャンセル
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">法人タイプ</label>
                                        <select
                                            value={editForm.entity_type || ''}
                                            onChange={e => setEditForm({ ...editForm, entity_type: e.target.value })}
                                            className="w-full mt-1 px-3 py-2 border rounded"
                                        >
                                            <option value="">未設定</option>
                                            {ENTITY_TYPES.map(e => (
                                                <option key={e.value} value={e.value}>{e.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">説明</label>
                                        <input
                                            type="text"
                                            value={editForm.description || ''}
                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                            className="w-full mt-1 px-3 py-2 border rounded"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">アイコンURL</label>
                                        <input
                                            type="text"
                                            value={editForm.avatar_url || ''}
                                            onChange={e => setEditForm({ ...editForm, avatar_url: e.target.value })}
                                            className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">全身画像URL</label>
                                        <input
                                            type="text"
                                            value={editForm.full_body_url || ''}
                                            onChange={e => setEditForm({ ...editForm, full_body_url: e.target.value })}
                                            className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600">トーンプロンプト</label>
                                    <textarea
                                        value={editForm.tone_prompt || ''}
                                        onChange={e => setEditForm({ ...editForm, tone_prompt: e.target.value })}
                                        rows={4}
                                        className="w-full mt-1 px-3 py-2 border rounded text-sm"
                                    />
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <div className="flex items-start gap-6">
                                <div className="flex-shrink-0">
                                    <img
                                        src={persona.avatar_url || '/assets/avatars/aoi_face_icon.jpg'}
                                        alt={persona.name}
                                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{persona.name}</h3>
                                        <span className="text-sm text-gray-500">({persona.code})</span>
                                        {getEntityBadge(persona.entity_type)}
                                    </div>
                                    <p className="text-gray-600 mb-3">{persona.description || '説明なし'}</p>
                                    {persona.tone_prompt && (
                                        <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 line-clamp-2">
                                            {persona.tone_prompt}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => startEdit(persona)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                >
                                    <Edit className="h-4 w-4" />
                                    編集
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2">ペルソナと法人タイプの対応</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>葵（Aoi）</strong> → 社会福祉法人：法務・ガバナンス支援</li>
                    <li>• <strong>秋（Aki）</strong> → NPO法人：運営・会計支援</li>
                    <li>• <strong>亜美（Ami）</strong> → 医療法人：経営・労務支援</li>
                </ul>
            </div>
        </div>
    );
}
