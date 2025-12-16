'use client';

import { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface CreateCampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (campaign: any) => void;
}

export function CreateCampaignModal({ isOpen, onClose, onCreated }: CreateCampaignModalProps) {
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_percent: 20,
        target_plan_id: 'pro',
        expires_at: '',
        max_uses: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, code });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/admin/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    max_uses: formData.max_uses ? parseInt(formData.max_uses) : null
                })
            });

            if (!response.ok) throw new Error('Failed to create campaign');

            const newCampaign = await response.json();
            onCreated(newCampaign.campaign);
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert('作成に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">新規キャンペーン作成</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">キャンペーンコード</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-lg uppercase focus:ring-blue-500 focus:border-blue-500"
                                placeholder="PRO2025"
                                required
                                maxLength={20}
                            />
                            <button
                                type="button"
                                onClick={generateCode}
                                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                                title="ランダム生成"
                            >
                                <RefreshCw className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">アルファベット大文字と数字のみ</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">説明（管理用）</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="2025年新春キャンペーン"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Discount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">割引率 (%)</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={formData.discount_percent}
                                onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* Target Plan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">対象プラン</label>
                            <select
                                value={formData.target_plan_id}
                                onChange={(e) => setFormData({ ...formData, target_plan_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="standard">Standard</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Expiry */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">有効期限（任意）</label>
                            <input
                                type="date"
                                value={formData.expires_at}
                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Max Uses */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">使用回数制限（任意）</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.max_uses}
                                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="無制限"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? '作成中...' : '作成する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
