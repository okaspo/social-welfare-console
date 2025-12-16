'use client';

interface AssistantProfile {
    id: string;
    name: string;
    entity_type: string;
    color_primary: string;
    color_secondary: string;
    greeting_message: string;
    personality_traits: string[];
    expertise_areas: string[];
}

interface ProfileCardProps {
    assistant: AssistantProfile;
    onEdit: () => void;
    getEntityTypeLabel: (type: string) => string;
}

export function ProfileCard({ assistant, onEdit, getEntityTypeLabel }: ProfileCardProps) {
    return (
        <div
            className="bg-white rounded-lg shadow-md border-2 hover:shadow-lg transition-shadow"
            style={{ borderColor: assistant.color_primary }}
        >
            {/* Header */}
            <div
                className="p-6 rounded-t-lg"
                style={{
                    background: `linear-gradient(135deg, ${assistant.color_primary}10 0%, ${assistant.color_secondary}10 100%)`
                }}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        {/* Avatar placeholder */}
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                            style={{ backgroundColor: assistant.color_primary }}
                        >
                            {assistant.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {assistant.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {getEntityTypeLabel(assistant.entity_type)}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onEdit}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        編集
                    </button>
                </div>

                {/* Color Swatches */}
                <div className="flex space-x-2">
                    <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-600">Primary:</span>
                        <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: assistant.color_primary }}
                        />
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-600">Secondary:</span>
                        <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: assistant.color_secondary }}
                        />
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
                {/* Greeting */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">挨拶メッセージ</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                        {assistant.greeting_message}
                    </p>
                </div>

                {/* Personality */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">性格</h4>
                    <div className="flex flex-wrap gap-1">
                        {assistant.personality_traits?.slice(0, 4).map((trait, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 text-xs rounded-full"
                                style={{
                                    backgroundColor: `${assistant.color_primary}20`,
                                    color: assistant.color_primary
                                }}
                            >
                                {trait}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Expertise */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">専門分野</h4>
                    <div className="flex flex-wrap gap-1">
                        {assistant.expertise_areas?.slice(0, 3).map((area, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                            >
                                {area}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
