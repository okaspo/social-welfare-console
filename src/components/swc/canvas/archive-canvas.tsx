'use client';

import { useState } from 'react';
import { FileText, Clock, Search, Filter, Calendar, ChevronRight, Download, Eye } from 'lucide-react';

interface Document {
    id: string;
    title: string;
    type: 'minutes' | 'resolution' | 'report' | 'draft';
    createdAt: string;
    meetingType?: string;
    status?: 'draft' | 'final';
}

interface ArchiveCanvasProps {
    documents: Document[];
    onDocumentClick: (doc: Document) => void;
    onDownload?: (doc: Document) => void;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    minutes: { label: '議事録', color: 'bg-blue-100 text-blue-700' },
    resolution: { label: '決議書', color: 'bg-purple-100 text-purple-700' },
    report: { label: '報告書', color: 'bg-green-100 text-green-700' },
    draft: { label: '下書き', color: 'bg-amber-100 text-amber-700' },
};

const MEETING_LABELS: Record<string, string> = {
    board_meeting: '理事会',
    council_meeting: '評議員会',
    general_meeting: '総会',
    committee: '委員会',
};

export default function ArchiveCanvas({ documents, onDocumentClick, onDownload }: ArchiveCanvasProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || doc.type === filterType;
        return matchesSearch && matchesType;
    });

    // Group by month
    const groupedByMonth = filteredDocs.reduce((acc, doc) => {
        const date = new Date(doc.createdAt);
        const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(doc);
        return acc;
    }, {} as Record<string, Document[]>);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">文書</h2>
                <p className="text-sm text-gray-500 mt-1">議事録・決議書・報告書のアーカイブ</p>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="文書を検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="all">すべて</option>
                    <option value="minutes">議事録</option>
                    <option value="resolution">決議書</option>
                    <option value="report">報告書</option>
                    <option value="draft">下書き</option>
                </select>
            </div>

            {/* Documents by Month */}
            {Object.entries(groupedByMonth).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(groupedByMonth).map(([month, docs]) => (
                        <div key={month}>
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <h3 className="text-sm font-semibold text-gray-600">{month}</h3>
                                <span className="text-xs text-gray-400">({docs.length}件)</span>
                            </div>
                            <div className="space-y-2">
                                {docs.map(doc => {
                                    const typeConfig = TYPE_LABELS[doc.type];
                                    return (
                                        <div
                                            key={doc.id}
                                            className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg hover:border-indigo-200 hover:shadow-sm transition-all group"
                                        >
                                            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 text-sm truncate">{doc.title}</span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${typeConfig.color}`}>
                                                        {typeConfig.label}
                                                    </span>
                                                    {doc.status === 'draft' && (
                                                        <span className="text-xs text-amber-600">未完成</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(doc.createdAt).toLocaleDateString('ja-JP')}
                                                    {doc.meetingType && (
                                                        <>
                                                            <span>•</span>
                                                            {MEETING_LABELS[doc.meetingType] || doc.meetingType}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onDocumentClick(doc)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                    title="表示"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {onDownload && (
                                                    <button
                                                        onClick={() => onDownload(doc)}
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                                        title="ダウンロード"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>文書がありません</p>
                    <p className="text-sm mt-1">「議事録を作成して」と話しかけてください</p>
                </div>
            )}

            {/* Tips */}
            <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">💡 ヒント</div>
                <ul className="text-xs text-gray-500 space-y-1">
                    <li>・文書を選択すると内容を確認しながらAIに相談できます</li>
                    <li>・「先月の理事会議事録を見せて」などと話しかけても表示できます</li>
                </ul>
            </div>
        </div>
    );
}
