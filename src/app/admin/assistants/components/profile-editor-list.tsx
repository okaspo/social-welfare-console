'use client';

import { useState } from 'react';
import { ProfileCard } from './profile-card';
import { ProfileEditModal } from './profile-edit-modal';

interface AssistantProfile {
    id: string;
    name: string;
    entity_type: string;
    color_primary: string;
    color_secondary: string;
    greeting_message: string;
    personality_traits: string[];
    expertise_areas: string[];
    avatar_spring_url?: string;
    avatar_summer_url?: string;
    avatar_autumn_url?: string;
    avatar_winter_url?: string;
}

interface ProfileEditorListProps {
    assistants: AssistantProfile[];
}

export function ProfileEditorList({ assistants }: ProfileEditorListProps) {
    const [selectedAssistant, setSelectedAssistant] = useState<AssistantProfile | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleEdit = (assistant: AssistantProfile) => {
        setSelectedAssistant(assistant);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setSelectedAssistant(null);
    };

    const handleSave = async (updatedProfile: Partial<AssistantProfile>) => {
        if (!selectedAssistant) return;

        try {
            const response = await fetch(`/api/admin/assistants/${selectedAssistant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProfile)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            // Refresh the page to show updated data
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('プロフィールの更新に失敗しました');
        }
    };

    const getEntityTypeLabel = (type: string) => {
        switch (type) {
            case 'social_welfare': return '社会福祉法人';
            case 'npo': return 'NPO法人';
            case 'medical': return '医療法人';
            default: return type;
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assistants.map((assistant) => (
                    <ProfileCard
                        key={assistant.id}
                        assistant={assistant}
                        onEdit={() => handleEdit(assistant)}
                        getEntityTypeLabel={getEntityTypeLabel}
                    />
                ))}
            </div>

            {selectedAssistant && (
                <ProfileEditModal
                    isOpen={isModalOpen}
                    assistant={selectedAssistant}
                    onClose={handleClose}
                    onSave={handleSave}
                    getEntityTypeLabel={getEntityTypeLabel}
                />
            )}
        </>
    );
}
