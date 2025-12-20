'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Image, Upload, Copy, Check, FolderOpen, Loader2 } from 'lucide-react';

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
    const [uploading, setUploading] = useState(false);
    const [uploadCategory, setUploadCategory] = useState<'avatars' | 'hero'>('avatars');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleUpload = async (file: File) => {
        if (!file) return;

        setUploading(true);
        try {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${uploadCategory}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('assets')
                .getPublicUrl(filePath);

            const newAsset: Asset = {
                name: fileName,
                path: publicUrl,
                category: uploadCategory,
            };

            setAssets(prev => [...prev, newAsset]);
            alert('アップロード完了: ' + fileName);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('アップロードエラー: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleUpload(e.target.files[0]);
        }
    };

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

            {/* Upload Section */}
            <div className="mt-6 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileSelect}
                    accept="image/*"
                    className="hidden"
                />

                {uploading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
                        <p className="text-indigo-600 font-medium">アップロード中...</p>
                    </div>
                ) : (
                    <>
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium mb-2">新しい画像をアップロード</p>
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <span className="text-sm text-gray-500">カテゴリ:</span>
                            <select
                                value={uploadCategory}
                                onChange={(e) => setUploadCategory(e.target.value as 'avatars' | 'hero')}
                                className="px-3 py-1 border rounded text-sm"
                            >
                                <option value="avatars">アバター</option>
                                <option value="hero">ヒーロー</option>
                            </select>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            ファイルを選択
                        </button>
                        <p className="text-xs text-gray-400 mt-2">
                            ※Supabase Storage にアップロードされます
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
