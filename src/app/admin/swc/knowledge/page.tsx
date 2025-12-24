import { getScopedKnowledge } from '@/lib/admin/scoped-queries';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import KnowledgeList from '@/components/admin/knowledge-list';
import KnowledgeUploader from '@/components/admin/knowledge-uploader';

export default async function SwcKnowledgePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const items = await getScopedKnowledge({ pathname: '/admin/swc/knowledge' });

    // Transform for KnowledgeList if needed, assuming types match for now or adapter needed
    // Assuming KnowledgeItem type in component matches DB result more or less

    return (
        <div className="p-6">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <BookOpen className="h-4 w-4" />
                    <span>社会福祉法人コンソール</span>
                    <span>/</span>
                    <span>ナレッジ管理</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">ナレッジベース (SWC)</h1>
                <p className="text-gray-600 mt-1">
                    AIが参照する法令文書や内部規定を管理します（社会福祉法人及び共通）
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    {/* @ts-ignore */}
                    <KnowledgeList items={items} />
                </div>
                <div className="space-y-6">
                    <KnowledgeUploader />
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                        <h4 className="font-bold mb-2">運用tips</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>PDF等のファイルアップロードは現在開発中です。</li>
                            <li>テキストはMarkdown形式で記述すると見やすくなります。</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
