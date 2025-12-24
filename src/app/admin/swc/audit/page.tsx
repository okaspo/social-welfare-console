import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldCheck, Calendar, FileText } from 'lucide-react';

export default async function SwcAuditPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch Audit Criteria (Master)
    const { data: criteria } = await supabase
        .from('audit_criteria_master')
        .select('*')
        .or('target_entity_type.eq.social_welfare,target_entity_type.eq.all')
        .eq('is_active', true)
        .order('category');

    return (
        <div className="p-6">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>社会福祉法人コンソール</span>
                    <span>/</span>
                    <span>監査基準管理</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">監査基準・ログ</h1>
                <p className="text-gray-600 mt-1">
                    自動監査AIが使用するチェックリスト基準を管理します。
                </p>
            </div>

            <div className="bg-white rounded-xl border shadow-sm">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-700">有効な監査基準 ({criteria?.length || 0})</h3>
                </div>
                <div className="divide-y">
                    {criteria?.map((item: any) => (
                        <div key={item.id} className="p-4 hover:bg-gray-50 flex justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">{item.category}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.severity === 'High' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {item.severity}
                                    </span>
                                </div>
                                <p className="font-medium text-gray-900">{item.question}</p>
                                <p className="text-sm text-gray-500 mt-1">根拠法令: {item.legal_reference}</p>
                            </div>
                            <div className="text-right text-xs text-gray-400">
                                {item.target_entity_type === 'all' ? '共通' : '社福のみ'}
                            </div>
                        </div>
                    ))}
                    {(!criteria || criteria.length === 0) && (
                        <div className="p-8 text-center text-gray-500">
                            登録された監査基準はありません
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
