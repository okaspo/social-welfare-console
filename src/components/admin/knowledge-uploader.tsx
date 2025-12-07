'use client'

import { Upload, Plus } from 'lucide-react'

export default function KnowledgeUploader() {
    return (
        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 h-full flex flex-col justify-center items-center text-center border-dashed hover:border-blue-300 transition-colors cursor-pointer group">
            <div className="p-4 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors mb-3">
                <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">新しい知識を追加</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
                法令、規程、FAQなどのテキストデータ、またはPDF/Wordファイルをアップロードしてください。
            </p>
            <button className="mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                ファイルを選択
            </button>
        </div>
    )
}
