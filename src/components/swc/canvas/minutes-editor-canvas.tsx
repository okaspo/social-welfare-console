'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { FileText, Save, Clock, Users, Calendar, Sparkles, Loader2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface MinutesData {
    meetingType: string;
    corporationName: string;
    date: string;
    attendees: string[];
    agenda: string[];
    content: string;
}

export type FieldName = keyof MinutesData;

export interface FieldUpdate {
    field: FieldName;
    value: any;
    timestamp: number;
}

interface MinutesEditorCanvasProps {
    template: MinutesData;
    onSave?: (data: MinutesData) => void;
    onAutoSave?: (data: MinutesData) => void;

    // AI更新用
    externalUpdates?: FieldUpdate[];
    isAiTyping?: boolean;
    currentlyUpdatingField?: FieldName | null;
}

const MEETING_TYPES = [
    { value: 'board_meeting', label: '理事会' },
    { value: 'council_meeting', label: '評議員会' },
    { value: 'general_meeting', label: '総会' },
    { value: 'committee', label: '委員会' },
];

// ============================================================================
// Field Wrapper with Highlight Animation
// ============================================================================

interface FieldWrapperProps {
    fieldName: FieldName;
    highlightedField: FieldName | null;
    isAiUpdating: boolean;
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

function FieldWrapper({ fieldName, highlightedField, isAiUpdating, label, icon, children }: FieldWrapperProps) {
    const isHighlighted = highlightedField === fieldName;
    const isBeingUpdated = isAiUpdating && highlightedField === fieldName;

    return (
        <div className={`
            relative transition-all duration-500
            ${isHighlighted ? 'transform scale-[1.01]' : ''}
        `}>
            <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                {icon}
                {label}
                {isBeingUpdated && (
                    <span className="ml-1 flex items-center gap-1 text-indigo-500">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        <span className="text-[10px]">AIが入力中...</span>
                    </span>
                )}
            </label>
            <div className={`
                relative rounded-lg transition-all duration-300
                ${isHighlighted ? 'ring-2 ring-indigo-400 ring-offset-2 shadow-lg' : ''}
            `}>
                {children}
                {isHighlighted && (
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-lg pointer-events-none animate-pulse" />
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function MinutesEditorCanvas({
    template,
    onSave,
    onAutoSave,
    externalUpdates = [],
    isAiTyping = false,
    currentlyUpdatingField = null
}: MinutesEditorCanvasProps) {
    const [data, setData] = useState<MinutesData>(template);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [highlightedField, setHighlightedField] = useState<FieldName | null>(null);
    const [recentlyUpdatedFields, setRecentlyUpdatedFields] = useState<Set<FieldName>>(new Set());
    const lastProcessedUpdateRef = useRef<number>(0);

    // Handle external updates from AI
    useEffect(() => {
        if (externalUpdates.length === 0) return;

        const latestUpdate = externalUpdates[externalUpdates.length - 1];
        if (latestUpdate.timestamp <= lastProcessedUpdateRef.current) return;

        // Apply the update
        setData(prev => ({
            ...prev,
            [latestUpdate.field]: latestUpdate.value
        }));

        // Highlight the field
        setHighlightedField(latestUpdate.field);
        setRecentlyUpdatedFields(prev => new Set([...prev, latestUpdate.field]));

        // Remove highlight after animation
        setTimeout(() => setHighlightedField(null), 1500);

        // Track processed update
        lastProcessedUpdateRef.current = latestUpdate.timestamp;
    }, [externalUpdates]);

    // Handle AI typing indicator
    useEffect(() => {
        if (currentlyUpdatingField) {
            setHighlightedField(currentlyUpdatingField);
        }
    }, [currentlyUpdatingField]);

    const handleChange = useCallback((field: FieldName, value: any) => {
        setData(prev => {
            const newData = { ...prev, [field]: value };
            onAutoSave?.(newData);
            return newData;
        });
    }, [onAutoSave]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave?.(data);
            setLastSaved(new Date());
        } finally {
            setIsSaving(false);
        }
    };

    const meetingTypeLabel = MEETING_TYPES.find(t => t.value === data.meetingType)?.label || '会議';

    return (
        <div className="space-y-6">
            {/* Header with AI Status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-bold text-gray-900">{meetingTypeLabel}議事録</h2>
                </div>
                <div className="flex items-center gap-3">
                    {isAiTyping && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-full">
                            <Loader2 className="h-3 w-3 text-indigo-600 animate-spin" />
                            <span className="text-xs text-indigo-600 font-medium">葵が入力中...</span>
                        </div>
                    )}
                    {lastSaved && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {lastSaved.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 保存済み
                        </div>
                    )}
                </div>
            </div>

            {/* Recently Updated Indicator */}
            {recentlyUpdatedFields.size > 0 && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                    <Sparkles className="h-4 w-4" />
                    <span>AIが更新: {Array.from(recentlyUpdatedFields).map(f => {
                        const labels: Record<string, string> = {
                            date: '日付', meetingType: '会議種別', attendees: '出席者',
                            agenda: '議題', content: '内容', corporationName: '法人名'
                        };
                        return labels[f] || f;
                    }).join('、')}</span>
                </div>
            )}

            {/* Form */}
            <div className="space-y-4">
                {/* Meeting Type & Date */}
                <div className="grid grid-cols-2 gap-4">
                    <FieldWrapper
                        fieldName="meetingType"
                        highlightedField={highlightedField}
                        isAiUpdating={isAiTyping}
                        label="会議種別"
                    >
                        <select
                            value={data.meetingType}
                            onChange={(e) => handleChange('meetingType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {MEETING_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </FieldWrapper>

                    <FieldWrapper
                        fieldName="date"
                        highlightedField={highlightedField}
                        isAiUpdating={isAiTyping}
                        label="開催日"
                        icon={<Calendar className="h-3 w-3" />}
                    >
                        <input
                            type="date"
                            value={data.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </FieldWrapper>
                </div>

                {/* Corporation Name */}
                <FieldWrapper
                    fieldName="corporationName"
                    highlightedField={highlightedField}
                    isAiUpdating={isAiTyping}
                    label="法人名"
                >
                    <input
                        type="text"
                        value={data.corporationName}
                        onChange={(e) => handleChange('corporationName', e.target.value)}
                        placeholder="社会福祉法人○○会"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </FieldWrapper>

                {/* Attendees */}
                <FieldWrapper
                    fieldName="attendees"
                    highlightedField={highlightedField}
                    isAiUpdating={isAiTyping}
                    label="出席者（カンマ区切り）"
                    icon={<Users className="h-3 w-3" />}
                >
                    <input
                        type="text"
                        value={data.attendees.join(', ')}
                        onChange={(e) => handleChange('attendees', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="山田太郎, 佐藤花子, 鈴木一郎"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {data.attendees.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {data.attendees.map((name, i) => (
                                <span
                                    key={i}
                                    className={`
                                        px-2 py-0.5 text-xs rounded-full transition-all duration-300
                                        ${highlightedField === 'attendees'
                                            ? 'bg-indigo-100 text-indigo-700 animate-pulse'
                                            : 'bg-gray-100 text-gray-700'}
                                    `}
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    )}
                </FieldWrapper>

                {/* Agenda */}
                <FieldWrapper
                    fieldName="agenda"
                    highlightedField={highlightedField}
                    isAiUpdating={isAiTyping}
                    label="議題"
                >
                    <textarea
                        value={data.agenda.join('\n')}
                        onChange={(e) => handleChange('agenda', e.target.value.split('\n').filter(Boolean))}
                        placeholder="第1号議案 ○○について&#10;第2号議案 △△の件"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                </FieldWrapper>

                {/* Content */}
                <FieldWrapper
                    fieldName="content"
                    highlightedField={highlightedField}
                    isAiUpdating={isAiTyping}
                    label="議事内容"
                >
                    <textarea
                        value={data.content}
                        onChange={(e) => handleChange('content', e.target.value)}
                        placeholder="会議の内容を入力してください...&#10;&#10;AIに「議事録を完成させて」と依頼すると、整形してくれます。"
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                </FieldWrapper>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {isSaving ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    保存する
                </button>
            </div>

            {/* Tips */}
            <div className="p-3 bg-indigo-50 rounded-lg text-sm text-indigo-700">
                <div className="font-medium mb-1">💡 Chat-First モード</div>
                <ul className="text-xs space-y-1 text-indigo-600">
                    <li>・葵に話しかけると、自動的に入力されます</li>
                    <li>・「今日の理事会」→ 日付と種別が入力</li>
                    <li>・「山田理事長と佐藤理事が出席」→ 出席者が追加</li>
                </ul>
            </div>
        </div>
    );
}
