import { createClient } from '@/lib/supabase/server';
import { refreshMatches } from './actions';
import { Coins, RefreshCw, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { PlanGate } from '@/components/swc/billing/plan-gate';

export default async function SubsidiesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Unauthorized</div>;

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    const orgId = profile?.organization_id;

    if (!orgId) return <div>組織情報が見つかりません</div>;

    // Fetch Matches
    const { data: matches } = await supabase
        .from('organization_subsidies')
        .select(`
            match_score,
            status,
            subsidy:subsidies (
                title,
                provider,
                amount_min,
                amount_max,
                source_url,
                application_period_end
            )
        `)
        .eq('organization_id', orgId)
        .order('match_score', { ascending: false });

    const hasMatches = matches && matches.length > 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Coins className="h-6 w-6 text-yellow-500" />
                        おすすめ助成金
                    </h1>
                    <p className="text-gray-500 mt-1">
                        あなたの法人にマッチする助成金をAIが厳選しました。
                    </p>
                </div>
                <form action={refreshMatches}>
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
                        <RefreshCw className="h-4 w-4" />
                        AIマッチング実行
                    </button>
                </form>
            </div>

            {/* Plan Gate Verification: Only Pro/Standard can view results */}
            <PlanGate plan="standard" fallback={
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Coins className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">この機能は有料プラン限定です</h3>
                    <p className="text-gray-500 mb-6">助成金の自動マッチングをご利用いただくには、スタンダードプラン以上へのアップグレードが必要です。</p>
                    {/* The default PlanGate fallback UI handles the button, but we can customize if needed. 
                         Actually PlanGate default fallback is quite good. Let's just use PlanGate without custom fallback to see the default lock UI.
                     */}
                </div>
            }>
                {!hasMatches ? (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Coins className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">まだマッチング結果がありません</h3>
                        <p className="text-gray-500 mb-6">「AIマッチング実行」ボタンを押して、適合する助成金を探してみましょう。</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {matches.map((match: any, index: number) => (
                            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                                {/* Match Score Badge */}
                                <div className="absolute top-0 right-0 p-4">
                                    <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${match.match_score >= 0.8 ? 'bg-green-100 text-green-700' :
                                        match.match_score >= 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        <CheckCircle2 className="h-4 w-4" />
                                        マッチ度: {Math.round(match.match_score * 100)}%
                                    </div>
                                </div>

                                <div className="pr-32">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                            {match.subsidy.provider}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                        {match.subsidy.title}
                                    </h3>

                                    <div className="flex items-center gap-6 text-sm text-gray-600 mt-4">
                                        <div className="flex items-center gap-1">
                                            <Coins className="h-4 w-4 text-gray-400" />
                                            <span>
                                                {(match.subsidy.amount_min / 10000).toLocaleString()}万 ~ {(match.subsidy.amount_max / 10000).toLocaleString()}万円
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span>
                                                締切: {match.subsidy.application_period_end}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-end gap-3">
                                    <a
                                        href={match.subsidy.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        公式サイトを見る <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </PlanGate>
        </div>
    );
}
