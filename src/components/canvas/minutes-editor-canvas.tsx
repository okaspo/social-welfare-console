'use client';

import { useState, useCallback } from 'react';
import { FileText, Save, Clock, Users, Calendar, CheckCircle } from 'lucide-react';

interface MinutesTemplate {
    meetingType: string;
    corporationName: string;
    date: string;
    attendees: string[];
    agenda: string[];
    content: string;
}

interface MinutesEditorCanvasProps {
    template: MinutesTemplate;
    onSave?: (data: MinutesTemplate) => void;
    onAutoSave?: (data: MinutesTemplate) => void;
}

const MEETING_TYPES = [
    { value: 'board_meeting', label: '理事会' },
    { value: 'council_meeting', label: '評議員会' },
    { value: 'general_meeting', label: '総会' },
    { value: 'committee', label: '委員会' },
];

export default function MinutesEditorCanvas({
    template,
    onSave,
    onAutoSave
}: MinutesEditorCanvasProps) {
    const [data, setData] = useState<MinutesTemplate>(template);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const handleChange = useCallback((field: keyof MinutesTemplate, value: any) => {
        setData(prev => {
            const newData = { ...prev, [field]: value };
            // Trigger auto-save on change
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-bold text-gray-900">{meetingTypeLabel}議事録</h2>
                </div>
                {lastSaved && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {lastSaved.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 保存済み
                    </div>
                )}
            </div>

            {/* Form */}
            <div className="space-y-4">
                {/* Meeting Type & Date */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">会議種別</label>
                        <select
                            value={data.meetingType}
                            onChange={(e) => handleChange('meetingType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            {MEETING_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">開催日</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="date"
                                value={data.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Corporation Name */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">法人名</label>
                    <input
                        type="text"
                        value={data.corporationName}
                        onChange={(e) => handleChange('corporationName', e.target.value)}
                        placeholder="社会福祉法人○○会"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                {/* Attendees */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        出席者（カンマ区切り）
                    </label>
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
                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                                    {name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Agenda */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">議題</label>
                    <textarea
                        value={data.agenda.join('\n')}
                        onChange={(e) => handleChange('agenda', e.target.value.split('\n').filter(Boolean))}
                        placeholder="第1号議案 ○○について&#10;第2号議案 △△の件"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                </div>

                {/* Content */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">議事内容</label>
                    <textarea
                        value={data.content}
                        onChange={(e) => handleChange('content', e.target.value)}
                        placeholder="会議の内容を入力してください...&#10;&#10;AIに「議事録を完成させて」と依頼すると、整形してくれます。"
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                </div>
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
                <div className="font-medium mb-1">💡 ヒント</div>
                <ul className="text-xs space-y-1 text-indigo-600">
                    <li>・「議事録を整形して」で自動フォーマット</li>
                    <li>・「出席者を役員名簿から取得して」で自動入力</li>
                    <li>・「PDFで出力して」でダウンロード</li>
                </ul>
            </div>
        </div>
    );
}
