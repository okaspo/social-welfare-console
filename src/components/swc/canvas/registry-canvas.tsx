'use client';

import { useState } from 'react';
import { Users, FileText, Book, ChevronRight, Search } from 'lucide-react';

interface RegistryItem {
    id: string;
    type: 'officers' | 'articles' | 'bylaws';
    title: string;
    description: string;
    lastUpdated?: string;
    count?: number;
}

interface RegistryCanvasProps {
    items: RegistryItem[];
    onItemClick: (item: RegistryItem) => void;
}

const TYPE_CONFIG = {
    officers: {
        icon: Users,
        label: '役員名簿',
        color: 'bg-blue-100 text-blue-700',
        description: '理事・監事・評議員の一覧'
    },
    articles: {
        icon: FileText,
        label: '定款',
        color: 'bg-amber-100 text-amber-700',
        description: '法人の基本規則'
    },
    bylaws: {
        icon: Book,
        label: '規程',
        color: 'bg-green-100 text-green-700',
        description: '運営規程・細則'
    },
};

export default function RegistryCanvas({ items, onItemClick }: RegistryCanvasProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Default registry items if none provided
    const defaultItems: RegistryItem[] = [
        { id: '1', type: 'officers', title: '役員名簿', description: '理事・監事・評議員の一覧', count: 12 },
        { id: '2', type: 'articles', title: '定款', description: '法人の基本規則（最終改定: 2024年4月）' },
        { id: '3', type: 'bylaws', title: '運営規程一覧', description: '経理規程、人事規程など', count: 8 },
    ];

    const displayItems = items.length > 0 ? items : defaultItems;

    const filteredItems = displayItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">台帳</h2>
                <p className="text-sm text-gray-500 mt-1">法人のマスタデータを閲覧・編集</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="台帳を検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
            </div>

            {/* Registry Items */}
            <div className="space-y-3">
                {filteredItems.map(item => {
                    const config = TYPE_CONFIG[item.type];
                    const Icon = config.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onItemClick(item)}
                            className="w-full flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all group text-left"
                        >
                            <div className={`w-12 h-12 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                                    {item.count && (
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                            {item.count}件
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 truncate mt-0.5">{item.description}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                        </button>
                    );
                })}
            </div>

            {/* Tips */}
            <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">💡 ヒント</div>
                <ul className="text-xs text-gray-500 space-y-1">
                    <li>・チャットで「役員名簿を見せて」と言っても表示できます</li>
                    <li>・「理事長の任期はいつまで？」など質問もできます</li>
                </ul>
            </div>
        </div>
    );
}
