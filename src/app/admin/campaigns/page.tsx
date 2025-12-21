'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tags, Plus, Check, X, Heart, Users, Stethoscope, Building2, Percent, Loader2 } from 'lucide-react';
import { EntityTypeBadge } from '@/components/admin/entity-filter-tabs';

interface Campaign {
    id: string;
    code: string;
    name: string;
    description: string | null;
    target_entity_type: string;
    discount_percent: number;
    target_plan: string;
    starts_at: string;
    expires_at: string | null;
    is_active: boolean;
    max_uses: number | null;
    current_uses: number;
}

const ENTITY_TYPES = [
    { value: 'social_welfare', label: '社会福祉法人', icon: Heart, color: 'text-blue-600' },
    { value: 'npo', label: 'NPO法人', icon: Users, color: 'text-orange-600' },
    { value: 'medical_corp', label: '医療法人', icon: Stethoscope, color: 'text-green-600' },
    { value: 'general_inc', label: '一般社団法人', icon: Building2, color: 'text-purple-600' },
];

const PLANS = [
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' },
];

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const supabase = createClient();

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        target_entity_type: 'npo',
        discount_percent: 0,
        target_plan: 'starter',
        max_uses: '',
        expires_at: ''
    });

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setCampaigns(data);
        }
        setLoading(false);
    };

    const toggleActive = async (id: string, currentState: boolean) => {
        await supabase
            .from('campaigns')
            .update({ is_active: !currentState })
            .eq('id', id);
        fetchCampaigns();
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const { error } = await supabase
            .from('campaigns')
            .insert({
                code: formData.code.toUpperCase().trim(),
                name: formData.name,
                description: formData.description || null,
                target_entity_type: formData.target_entity_type,
                discount_percent: formData.discount_percent,
                target_plan: formData.target_plan,
                max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
                expires_at: formData.expires_at || null
            });

        if (!error) {
            setShowCreateModal(false);
            setFormData({
                code: '', name: '', description: '', target_entity_type: 'npo',
                discount_percent: 0, target_plan: 'starter', max_uses: '', expires_at: ''
            });
            fetchCampaigns();
        } else {
            alert('エラー: ' + error.message);
        }
        setIsSubmitting(false);
    };

    if (loading) {
        return <div className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Tags className="h-6 w-6 text-indigo-600" />
                        キャンペーン管理
                    </h1>
                    <p className="text-gray-500 mt-1">法人種別向けの招待コード・割引キャンペーンを発行</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    新規キャンペーン
                </button>
            </div>

            {/* Campaign List */}
            <div className="grid gap-4">
                {campaigns.length === 0 ? (
                    <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
                        キャンペーンがまだありません。新規作成してください。
                    </div>
                ) : (
                    campaigns.map(campaign => (
                        <div key={campaign.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 font-mono">{campaign.code}</h3>
                                        <EntityTypeBadge type={campaign.target_entity_type} />
                                        {campaign.discount_percent > 0 && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                                <Percent className="h-3 w-3" />
                                                {campaign.discount_percent}% OFF
                                            </span>
                                        )}
                                        {campaign.is_active ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">有効</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">無効</span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 mb-1">{campaign.name}</p>
                                    {campaign.description && (
                                        <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                                    )}
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">対象プラン:</span>
                                            <span className="ml-2 font-medium">{campaign.target_plan.toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">有効期限:</span>
                                            <span className="ml-2">{campaign.expires_at ? new Date(campaign.expires_at).toLocaleDateString('ja-JP') : '無期限'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">利用状況:</span>
                                            <span className="ml-2 font-bold">{campaign.current_uses}/{campaign.max_uses || '∞'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleActive(campaign.id, campaign.is_active)}
                                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                                    title={campaign.is_active ? '無効化' : '有効化'}
                                >
                                    {campaign.is_active ? <X className="h-4 w-4 text-gray-600" /> : <Check className="h-4 w-4 text-gray-600" />}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">新規キャンペーン作成</h2>
                        <form onSubmit={handleCreateCampaign} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">コード</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="NPO_START_2025"
                                        className="w-full mt-1 px-3 py-2 border rounded-md font-mono uppercase"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">名前</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="NPOスタートキャンペーン"
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">対象法人種別</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    {ENTITY_TYPES.map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, target_entity_type: type.value })}
                                            className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all ${formData.target_entity_type === type.value
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <type.icon className={`h-4 w-4 ${type.color}`} />
                                            <span className="text-sm font-medium">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">割引率 (%)</label>
                                    <input
                                        type="number"
                                        min="0" max="100"
                                        value={formData.discount_percent}
                                        onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) || 0 })}
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">対象プラン</label>
                                    <select
                                        value={formData.target_plan}
                                        onChange={(e) => setFormData({ ...formData, target_plan: e.target.value })}
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                    >
                                        {PLANS.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase">最大利用回数</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.max_uses}
                                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                                        placeholder="無制限"
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase">有効期限</label>
                                <input
                                    type="date"
                                    value={formData.expires_at}
                                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border rounded-md"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '作成'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
