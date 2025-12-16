'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AssistantProfile {
    id: string;
    name: string;
    entity_type: string;
    color_primary: string;
    color_secondary: string;
    greeting_message: string;
    personality_traits: string[];
    expertise_areas: string[];
    avatar_season_urls?: {
        spring?: string;
        summer?: string;
        autumn?: string;
        winter?: string;
    };
}

interface ProfileEditModalProps {
    isOpen: boolean;
    assistant: AssistantProfile;
    onClose: () => void;
    onSave: (updatedProfile: Partial<AssistantProfile>) => Promise<void>;
    getEntityTypeLabel: (type: string) => string;
}

export function ProfileEditModal({
    isOpen,
    assistant,
    onClose,
    onSave,
    getEntityTypeLabel
}: ProfileEditModalProps) {
    const [formData, setFormData] = useState(assistant);
    const [newTrait, setNewTrait] = useState('');
    const [newExpertise, setNewExpertise] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData({
            ...assistant,
            avatar_season_urls: assistant.avatar_season_urls || {}
        });
    }, [assistant]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    const addTrait = () => {
        if (newTrait.trim()) {
            setFormData({
                ...formData,
                personality_traits: [...(formData.personality_traits || []), newTrait.trim()]
            });
            setNewTrait('');
        }
    };

    const removeTrait = (index: number) => {
        setFormData({
            ...formData,
            personality_traits: formData.personality_traits.filter((_, i) => i !== index)
        });
    };

    const addExpertise = () => {
        if (newExpertise.trim()) {
            setFormData({
                ...formData,
                expertise_areas: [...(formData.expertise_areas || []), newExpertise.trim()]
            });
            setNewExpertise('');
        }
    };

    const removeExpertise = (index: number) => {
        setFormData({
            ...formData,
            expertise_areas: formData.expertise_areas.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div
                    className="p-6 border-b flex items-center justify-between"
                    style={{ borderBottomColor: formData.color_primary }}
                >
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {assistant.name} の編集
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {getEntityTypeLabel(assistant.entity_type)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            名前
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Primary Color
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="color"
                                    value={formData.color_primary}
                                    onChange={(e) => setFormData({ ...formData, color_primary: e.target.value })}
                                    className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.color_primary}
                                    onChange={(e) => setFormData({ ...formData, color_primary: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    pattern="^#[0-9A-Fa-f]{6}$"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Secondary Color
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="color"
                                    value={formData.color_secondary}
                                    onChange={(e) => setFormData({ ...formData, color_secondary: e.target.value })}
                                    className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.color_secondary}
                                    onChange={(e) => setFormData({ ...formData, color_secondary: e.target.value })}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                    pattern="^#[0-9A-Fa-f]{6}$"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Greeting Message */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            挨拶メッセージ
                        </label>
                        <textarea
                            value={formData.greeting_message}
                            onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                            required
                        />
                    </div>

                    {/* Personality Traits */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            性格
                        </label>
                        <div className="flex space-x-2 mb-2">
                            <input
                                type="text"
                                value={newTrait}
                                onChange={(e) => setNewTrait(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrait())}
                                placeholder="例: 丁寧"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={addTrait}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                追加
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.personality_traits?.map((trait, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 text-sm rounded-full flex items-center space-x-1"
                                    style={{
                                        backgroundColor: `${formData.color_primary}20`,
                                        color: formData.color_primary
                                    }}
                                >
                                    <span>{trait}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeTrait(index)}
                                        className="ml-1 text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Expertise Areas */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            専門分野
                        </label>
                        <div className="flex space-x-2 mb-2">
                            <input
                                type="text"
                                value={newExpertise}
                                onChange={(e) => setNewExpertise(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
                                placeholder="例: 社会福祉法"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={addExpertise}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                            >
                                追加
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.expertise_areas?.map((area, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full flex items-center space-x-1"
                                >
                                    <span>{area}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeExpertise(index)}
                                        className="ml-1 text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Seasonal Avatars */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                            季節アバター設定 (URL)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {['spring', 'summer', 'autumn', 'winter'].map((season) => (
                                <div key={season}>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                                        {season}
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.avatar_season_urls?.[season as keyof typeof formData.avatar_season_urls] || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            avatar_season_urls: {
                                                ...formData.avatar_season_urls,
                                                [season]: e.target.value
                                            }
                                        })}
                                        placeholder={`https://.../${season}.png`}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors font-medium"
                        disabled={isSaving}
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>
        </div>
    );
}
