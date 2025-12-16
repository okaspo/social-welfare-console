'use client';

import { useState } from 'react';
import { Plus, Copy, Trash2, Calendar, Users, DollarSign, Tag } from 'lucide-react';
import { CreateCampaignModal } from './create-campaign-modal';

interface CampaignCode {
    code: string;
    description: string;
    discount_percent: number;
    target_plan_id: string;
    expires_at: string | null;
    max_uses: number | null;
    current_uses: number;
    is_active: boolean;
    created_at: string;
}

interface CampaignListProps {
    initialCampaigns: CampaignCode[];
}

export function CampaignList({ initialCampaigns }: CampaignListProps) {
    const [campaigns, setCampaigns] = useState<CampaignCode[]>(initialCampaigns);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleCreate = (newCampaign: CampaignCode) => {
        setCampaigns([newCampaign, ...campaigns]);
        setIsModalOpen(false);
    };

    const handleDelete = async (code: string) => {
        if (!confirm('本当に削除しますか？この操作は取り消せません。')) return;

        setIsDeleting(code);
        try {
            const response = await fetch(`/api/admin/campaigns/${code}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete');

            setCampaigns(campaigns.filter(c => c.code !== code));
        } catch (error) {
            console.error('Error deleting campaign:', error);
            alert('削除に失敗しました');
        } finally {
            setIsDeleting(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('コピーしました: ' + text);
    };

    const getPlanName = (planId: string) => {
        switch (planId?.toLowerCase()) {
            case 'standard': return 'Standard';
            case 'pro': return 'Pro';
            case 'enterprise': return 'Enterprise';
            default: return planId || 'ALL';
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <Tag className="w-5 h-5 mr-2 text-blue-500" />
                        有効なキャンペーンコード
                    </h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        新規作成
                    </button>
                </div>

                <ul className="divide-y divide-gray-200">
                    {campaigns.length === 0 ? (
                        <li className="p-8 text-center text-gray-500">
                            キャンペーンコードはまだありません。
                        </li>
                    ) : (
                        campaigns.map((campaign) => (
                            <li key={campaign.code} className="hover:bg-gray-50 transition-colors">
                                <div className="px-6 py-4 flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center mb-1">
                                            <p className="text-lg font-bold text-blue-600 font-mono tracking-wider mr-3">
                                                {campaign.code}
                                            </p>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${campaign.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {campaign.is_active ? '有効' : '無効'}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(campaign.code)}
                                                className="ml-2 text-gray-400 hover:text-gray-600"
                                                title="コードをコピー"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-2">
                                            {campaign.description || '説明なし'}
                                        </p>

                                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                            <div className="flex items-center">
                                                <DollarSign className="w-3 h-3 mr-1" />
                                                割引: {campaign.discount_percent}% OFF ({getPlanName(campaign.target_plan_id)})
                                            </div>
                                            <div className="flex items-center">
                                                <Users className="w-3 h-3 mr-1" />
                                                使用数: {campaign.current_uses} / {campaign.max_uses || '無制限'}
                                            </div>
                                            {campaign.expires_at && (
                                                <div className="flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    期限: {new Date(campaign.expires_at).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="ml-4 flex items-center">
                                        <button
                                            onClick={() => handleDelete(campaign.code)}
                                            disabled={isDeleting === campaign.code}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                                            title="削除"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            <CreateCampaignModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreated={handleCreate}
            />
        </>
    );
}
