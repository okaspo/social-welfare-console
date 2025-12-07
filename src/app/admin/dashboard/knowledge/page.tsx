import KnowledgeList from "@/components/admin/knowledge-list"
import SearchSimulator from "@/components/admin/search-simulator"
import KnowledgeUploader from "@/components/admin/knowledge-uploader"
import { MOCK_KNOWLEDGE_ITEMS } from "@/lib/admin/knowledge-data"

export default function KnowledgePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">共通知識ライブラリ</h1>
                <p className="text-gray-500 text-sm mt-1">
                    法人運営に関する全知識（法令、内部規程、FAQなど）を一元管理し、AIの回答精度を向上させます。
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Management & Ingestion (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Ingestion Area */}
                    <div className="h-48">
                        <KnowledgeUploader />
                    </div>
                    {/* List Area */}
                    <KnowledgeList items={MOCK_KNOWLEDGE_ITEMS} />
                </div>

                {/* Right Column: Search Simulator (1/3) */}
                <div className="lg:col-span-1">
                    <SearchSimulator items={MOCK_KNOWLEDGE_ITEMS} />
                </div>
            </div>
        </div>
    )
}
