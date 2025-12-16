// PDF Knowledge Injection Interface
// Upload PDFs and inject knowledge for RAG system

'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UploadedFile {
    file: File;
    status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
    error?: string;
    id?: string;
}

export default function PDFKnowledgeInjectionPage() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [targetEntityType, setTargetEntityType] = useState<string>('all');
    const [uploading, setUploading] = useState(false);

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFiles = Array.from(e.target.files || []);
        const pdfFiles = selectedFiles.filter((f) => f.type === 'application/pdf');

        setFiles([
            ...files,
            ...pdfFiles.map((file) => ({
                file,
                status: 'pending' as const,
            })),
        ]);
    }

    async function uploadFile(uploadedFile: UploadedFile, index: number) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            updateFileStatus(index, 'error', 'ログインが必要です');
            return;
        }

        updateFileStatus(index, 'uploading');

        try {
            // 1. Upload PDF to storage
            const filePath = `knowledge/${Date.now()}_${uploadedFile.file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, uploadedFile.file);

            if (uploadError) throw uploadError;

            updateFileStatus(index, 'processing');

            // 2. Create knowledge item entry
            const { data, error: insertError } = await supabase
                .from('knowledge_items')
                .insert({
                    title: uploadedFile.file.name.replace('.pdf', ''),
                    content: '', // Will be processed by backend
                    category: 'pdf_upload',
                    target_entity_type: targetEntityType === 'all' ? null : targetEntityType,
                    file_path: filePath,
                    is_private: false,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // 3. Trigger processing (in real implementation, use background job)
            await fetch('/api/admin/knowledge/process-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    knowledgeItemId: data.id,
                    filePath,
                }),
            });

            updateFileStatus(index, 'success', undefined, data.id);
        } catch (error: any) {
            updateFileStatus(index, 'error', error.message);
        }
    }

    async function uploadAll() {
        setUploading(true);

        for (let i = 0; i < files.length; i++) {
            if (files[i].status === 'pending') {
                await uploadFile(files[i], i);
            }
        }

        setUploading(false);
    }

    function updateFileStatus(
        index: number,
        status: UploadedFile['status'],
        error?: string,
        id?: string
    ) {
        setFiles((prev) =>
            prev.map((f, i) =>
                i === index ? { ...f, status, error, id } : f
            )
        );
    }

    function removeFile(index: number) {
        setFiles(files.filter((_, i) => i !== index));
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                PDF知識注入
            </h1>

            {/* Entity Type Selection */}
            <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    対象法人種別
                </label>
                <select
                    value={targetEntityType}
                    onChange={(e) => setTargetEntityType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">全法人共通</option>
                    <option value="social_welfare">社会福祉法人のみ</option>
                    <option value="npo">NPO法人のみ</option>
                    <option value="medical">医療法人のみ</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                    アップロードされた知識は選択した法人種別のみに表示されます
                </p>
            </div>

            {/* File Upload Area */}
            <div className="mb-6">
                <label
                    htmlFor="pdf-upload"
                    className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium mb-1">
                        PDFファイルをドロップまたはクリックしてアップロード
                    </p>
                    <p className="text-sm text-gray-500">
                        複数ファイル選択可、最大10MB/ファイル
                    </p>
                    <input
                        id="pdf-upload"
                        type="file"
                        accept="application/pdf"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="mb-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">
                            アップロード待機中: {files.filter((f) => f.status === 'pending').length}件
                        </h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {files.map((f, index) => (
                            <li key={index} className="px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <FileText className="h-5 w-5 text-gray-400" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {f.file.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(f.file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {f.status === 'pending' && (
                                            <button
                                                onClick={() => removeFile(index)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <XCircle className="h-5 w-5" />
                                            </button>
                                        )}
                                        {f.status === 'uploading' && (
                                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                                        )}
                                        {f.status === 'processing' && (
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                処理中...
                                            </div>
                                        )}
                                        {f.status === 'success' && (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        )}
                                        {f.status === 'error' && (
                                            <div className="text-right">
                                                <XCircle className="h-5 w-5 text-red-600" />
                                                <p className="text-xs text-red-600 mt-0.5">{f.error}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Upload Button */}
            {files.length > 0 && files.some((f) => f.status === 'pending') && (
                <button
                    onClick={uploadAll}
                    disabled={uploading}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            アップロード中...
                        </>
                    ) : (
                        <>
                            <Upload className="h-5 w-5" />
                            {files.filter((f) => f.status === 'pending').length}件をアップロード
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
