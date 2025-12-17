'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus, Trash2, Image as ImageIcon, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Avatar {
    id: string;
    assistant_code: string;
    image_url: string;
    condition_type: 'default' | 'season' | 'emotion';
    condition_value: string;
    active_period_start: string | null;
    active_period_end: string | null;
}

interface AvatarManagerProps {
    assistantId: string;
    assistantCode: string; // 'aoi', 'aki', 'ami'
    assistantName: string;
}

export default function AvatarManager({ assistantId, assistantCode, assistantName }: AvatarManagerProps) {
    const router = useRouter();
    const supabase = createClient();
    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [newAvatar, setNewAvatar] = useState({
        image_url: '',
        condition_type: 'season',
        condition_value: 'spring',
        active_period_start: '',
        active_period_end: ''
    });

    useEffect(() => {
        fetchAvatars();
    }, [assistantCode]);

    const fetchAvatars = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('assistant_avatars')
            .select('*')
            .eq('assistant_code', assistantCode)
            .order('condition_type')
            .order('created_at', { ascending: false });

        if (data) setAvatars(data as any);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('削除してもよろしいですか？')) return;
        const { error } = await supabase.from('assistant_avatars').delete().eq('id', id);
        if (error) {
            alert('削除に失敗しました');
        } else {
            fetchAvatars();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        const { error } = await supabase.from('assistant_avatars').insert({
            assistant_code: assistantCode,
            image_url: newAvatar.image_url,
            condition_type: newAvatar.condition_type,
            condition_value: newAvatar.condition_value,
            active_period_start: newAvatar.active_period_start || null,
            active_period_end: newAvatar.active_period_end || null
        });

        if (error) {
            alert('保存に失敗しました: ' + error.message);
        } else {
            setShowForm(false);
            setNewAvatar({
                image_url: '',
                condition_type: 'season',
                condition_value: 'spring',
                active_period_start: '',
                active_period_end: ''
            });
            fetchAvatars();
        }
        setUploading(false);
    };

    const conditionLabel = (type: string, value: string) => {
        if (type === 'default') return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">基本</span>;
        if (type === 'season') return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">季節: {value}</span>;
        if (type === 'emotion') return <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">感情: {value}</span>;
        return value;
    };

    if (loading) return <div className="text-center p-8"><Loader2 className="animate-spin mx-auto text-gray-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h2 className="font-bold text-lg text-gray-900">{assistantName}のアバター管理</h2>
                    <p className="text-sm text-gray-500">コード: {assistantCode}</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="h-4 w-4" /> 新規追加
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {avatars.map(avatar => (
                    <div key={avatar.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition group relative">
                        <div className="aspect-[3/4] bg-gray-100 relative">
                            {avatar.image_url ? (
                                <img src={avatar.image_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-300">
                                    <ImageIcon className="h-12 w-12" />
                                </div>
                            )}
                            <div className="absolute top-2 left-2">
                                {conditionLabel(avatar.condition_type, avatar.condition_value)}
                            </div>
                            <button
                                onClick={() => handleDelete(avatar.id)}
                                className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition hover:bg-white"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-3 text-xs text-gray-500 space-y-1">
                            {avatar.active_period_start && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {avatar.active_period_start} ~ {avatar.active_period_end || '...'}
                                </div>
                            )}
                            <div className="truncate text-[10px] text-gray-300">{avatar.id}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="font-bold text-lg">新規アバター追加</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">画像URL</label>
                                <input
                                    type="text"
                                    required
                                    value={newAvatar.image_url}
                                    onChange={e => setNewAvatar({ ...newAvatar, image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                                <p className="text-xs text-gray-400 mt-1">※現時点では外部URLまたはpublicバケットのパスを指定</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">条件タイプ</label>
                                    <select
                                        value={newAvatar.condition_type}
                                        onChange={e => setNewAvatar({ ...newAvatar, condition_type: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        <option value="season">季節 (Season)</option>
                                        <option value="emotion">感情 (Emotion)</option>
                                        <option value="default">基本 (Default)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">値</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAvatar.condition_value}
                                        onChange={e => setNewAvatar({ ...newAvatar, condition_value: e.target.value })}
                                        placeholder="例: spring, happy"
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">開始日 (任意)</label>
                                    <input
                                        type="date"
                                        value={newAvatar.active_period_start}
                                        onChange={e => setNewAvatar({ ...newAvatar, active_period_start: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">終了日 (任意)</label>
                                    <input
                                        type="date"
                                        value={newAvatar.active_period_end}
                                        onChange={e => setNewAvatar({ ...newAvatar, active_period_end: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
