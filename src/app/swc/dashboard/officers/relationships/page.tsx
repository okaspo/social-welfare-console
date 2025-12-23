import { createClient } from '@/lib/supabase/server';
import { Users, AlertTriangle, Info, Plus } from 'lucide-react';
import RelationshipMatrix from './relation-matrix';

export default async function RelationshipMatrixPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Unauthorized</div>;

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) return <div>組織情報が見つかりません</div>;

    // Fetch Active Officers
    const { data: officers } = await supabase
        .from('officers')
        .select('id, name, role')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('role', { ascending: true }); // Ideally specific order

    // Fetch Existing Relationships
    const { data: relationships } = await supabase
        .from('officer_relationships')
        .select('*')
        .eq('organization_id', profile.organization_id);

    // Check Compliance (Social Welfare Act Article 45-13: 1/3 Rule)
    // Using the DB function created in migration
    const { data: complianceCheck } = await supabase
        .rpc('check_relative_ratio_compliance', { org_id: profile.organization_id });

    // Since RPC returns a set, we take the first row (should be only one)
    const compliance = complianceCheck && complianceCheck.length > 0 ? complianceCheck[0] : null;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-indigo-600" />
                    役員親族関係マトリクス
                </h1>
                <p className="text-gray-500 mt-1">
                    社会福祉法第45条の13（親族等の理事の割合）の遵守状況を可視化・管理します。
                </p>
            </div>

            {/* Compliance Status Banner */}
            {compliance && (
                <div className={`p-4 rounded-xl border ${compliance.is_compliant
                        ? 'bg-emerald-50 border-emerald-100'
                        : 'bg-red-50 border-red-100'
                    }`}>
                    <div className="flex items-start gap-3">
                        {compliance.is_compliant ? (
                            <Info className="h-5 w-5 text-emerald-600 mt-0.5" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div>
                            <h3 className={`font-bold ${compliance.is_compliant ? 'text-emerald-900' : 'text-red-900'
                                }`}>
                                {compliance.is_compliant ? '法令基準を満たしています (適法)' : '法令違反の可能性があります (要改善)'}
                            </h3>
                            <p className={`text-sm mt-1 ${compliance.is_compliant ? 'text-emerald-700' : 'text-red-700'
                                }`}>
                                {compliance.is_compliant
                                    ? `親族等関係者の理事は${compliance.related_directors}名で、上限（${compliance.max_allowed}名）以下です。`
                                    : compliance.violation_message
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Matrix Interaction Component */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-hidden">
                <RelationshipMatrix
                    officers={officers || []}
                    relationships={relationships || []}
                />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500 space-y-1">
                <p className="font-bold">※ 社会福祉法第45条の13（親族等の特殊関係がある者の制限）</p>
                <p>各役員について、その配偶者・三親等以内の親族・その他特殊の関係がある者が、理事総数の3分の1を超えて含まれてはなりません。</p>
            </div>
        </div>
    );
}
