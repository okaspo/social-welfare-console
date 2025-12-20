'use client';

import { useState } from 'react';
import { Image, Upload, Copy, Check, FolderOpen } from 'lucide-react';

interface Asset {
    name: string;
    path: string;
    category: 'avatars' | 'hero' | 'other';
}

// Predefined assets from public folder
const PREDEFINED_ASSETS: Asset[] = [
    { name: 'aoi_full_body.jpg', path: '/assets/avatars/aoi_full_body.jpg', category: 'avatars' },
    { name: 'aoi_face_icon.jpg', path: '/assets/avatars/aoi_face_icon.jpg', category: 'avatars' },
    { name: 'office_scene.jpg', path: '/assets/hero/office_scene.jpg', category: 'hero' },
];

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>(PREDEFINED_ASSETS);
    const [filter, setFilter] = useState<'all' | 'avatars' | 'hero'>('all');
    const [copiedPath, setCopiedPath] = useState<string | null>(null);

    const filteredAssets = filter === 'all'
        ? assets
        : assets.filter(a => a.category === filter);

    const copyPath = (path: string) => {
        navigator.clipboard.writeText(path);
        setCopiedPath(path);
        setTimeout(() => setCopiedPath(null), 2000);
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'avatars': return 'アバター';
            case 'hero': return 'ヒーロー';
            default: return 'その他';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'avatars': return 'bg-indigo-100 text-indigo-700';
            case 'hero': return 'bg-amber-100 text-amber-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Image className="h-6 w-6 text-indigo-600" />
                        画像アセット管理
                    </h1>
                    <p className="text-gray-500 mt-1">
                        アプリケーションで使用する画像を管理します
                    </p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => window.open('/assets', '_blank')}
                >
                    <FolderOpen className="h-4 w-4" />
                    フォルダを開く
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { value: 'all', label: 'すべて' },
                    { value: 'avatars', label: 'アバター' },
                    { value: 'hero', label: 'ヒーロー' },
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.value
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredAssets.map(asset => (
                    <div
                        key={asset.path}
                        className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="aspect-square bg-gray-100 relative">
                            <img
                                src={asset.path}
                                alt={asset.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.png';
                                }}
                            />
                            <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${getCategoryColor(asset.category)}`}>
                                {getCategoryLabel(asset.category)}
                            </span>
                        </div>
                        <div className="p-4">
                            <h3 className="font-medium text-gray-900 text-sm truncate" title={asset.name}>
                                {asset.name}
                            </h3>
                            <div className="flex items-center justify-between mt-2">
                                <code className="text-xs text-gray-500 truncate flex-1" title={asset.path}>
                                    {asset.path}
                                </code>
                                <button
                                    onClick={() => copyPath(asset.path)}
                                    className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="パスをコピー"
                                >
                                    {copiedPath === asset.path ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Usage Guide */}
            <div className="mt-8 bg-gray-50 border rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-3">使用方法</h3>
                <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>アバター画像:</strong> チャット画面のアイコン、プロフィール表示</p>
                    <p><strong>ヒーロー画像:</strong> ログイン画面、LP背景</p>
                    <p className="mt-4">
                        <strong>パスの使用例:</strong>
                        <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">
                            {'<img src="/assets/avatars/aoi_face_icon.jpg" />'}
                        </code>
                    </p>
                </div>
            </div>

            {/* Future: Upload Section */}
            <div className="mt-6 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">新しい画像をアップロード（今後実装予定）</p>
                <p className="text-xs text-gray-400 mt-1">
                    現在は public/assets フォルダに直接配置してください
                </p>
            </div>
        </div>
    );
}
