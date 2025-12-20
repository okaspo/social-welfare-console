'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tags, Plus, Edit, Trash2, Check, X } from 'lucide-react';

interface Campaign {
    id: string;
    code: string;
    description: string | null;
    starts_at: string;
    expires_at: string | null;
    is_active: boolean;
    max_uses: number | null;
    current_uses: number;
    unlocked_features: string[];
    target_plans: string[];
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        const { data, error } = await supabase
            .from('campaign_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setCampaigns(data);
        }
        setLoading(false);
    };

    const toggleActive = async (id: string, currentState: boolean) => {
        await supabase
            .from('campaign_codes')
            .update({ is_active: !currentState })
            .eq('id', id);

        fetchCampaigns();
    };

    if (loading) {
        return <div className="p-10 text-center">読み込み中...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Tags className="h-6 w-6 text-indigo-600" />
                        キャンペーン管理
                    </h1>
                    <p className="text-gray-500 mt-1">プロモーションコードによる機能解放を管理</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    新規キャンペーン
                </button>
            </div>

            <div className="grid gap-4">
                {campaigns.length === 0 ? (
                    <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
                        キャンペーンがまだありません。新規作成してください。
                    </div>
                ) : (
                    campaigns.map(campaign => (
                        <div
                            key={campaign.id}
                            className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">
                                            {campaign.code}
                                        </h3>
                                        {campaign.is_active ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                                有効
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                無効
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-700">対象プラン:</span>
                                            <span className="ml-2">{campaign.target_plans.map(p => p.toUpperCase()).join(', ')}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">解放機能:</span>
                                            <span className="ml-2">{campaign.unlocked_features.length}個</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">有効期限:</span>
                                            <span className="ml-2">
                                                {campaign.expires_at
                                                    ? new Date(campaign.expires_at).toLocaleDateString('ja-JP')
                                                    : '無期限'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">利用状況:</span>
                                            <span className="ml-2">
                                                {campaign.current_uses}/{campaign.max_uses || '∞'}
                                            </span>
                                        </div>
                                    </div>

                                    {campaign.unlocked_features.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {campaign.unlocked_features.map(feature => (
                                                <span
                                                    key={feature}
                                                    className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-200"
                                                >
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => toggleActive(campaign.id, campaign.is_active)}
                                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                                        title={campaign.is_active ? '無効化' : '有効化'}
                                    >
                                        {campaign.is_active ? (
                                            <X className="h-4 w-4 text-gray-600" />
                                        ) : (
                                            <Check className="h-4 w-4 text-gray-600" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
