// Subsidy Matcher Dashboard Page
// Display AI-matched subsidies for user's organization

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { matchSubsidies, updateSubsidyStatus } from '@/lib/subsidies/matcher';
import { Sparkles, TrendingUp, Calendar, Building2, Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';
import PlanGate from '@/components/billing/plan-gate';
import { useCurrentPlan } from '@/hooks/use-current-plan';

interface SubsidyMatch {
    subsidy_id: string;
    title: string;
    provider: string;
    amount_min: number;
    amount_max: number;
    match_score: number;
    match_reason: string;
    deadline: string;
    status?: string;
}

export default function SubsidyMatcherPage() {
    const { plan, loading: planLoading } = useCurrentPlan();
    const [matches, setMatches] = useState<SubsidyMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [matching, setMatching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadMatches();
    }, []);

    async function loadMatches() {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError('ログインが必要です');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!profile?.organization_id) {
                setError('組織が見つかりません');
                return;
            }

            // Load existing matches
            const { data: existingMatches } = await supabase
                .from('organization_subsidies')
                .select(`
          subsidy_id,
          match_score,
          match_reason,
          status,
          subsidies (
            title,
            provider,
            amount_min,
            amount_max,
            application_period_end
          )
        `)
                .eq('organization_id', profile.organization_id)
                .order('match_score', { ascending: false });

            if (existingMatches) {
                const formatted = existingMatches.map((m: any) => ({
                    subsidy_id: m.subsidy_id,
                    // @ts-ignore
                    title: m.subsidies.title,
                    // @ts-ignore
                    provider: m.subsidies.provider,
                    // @ts-ignore
                    amount_min: m.subsidies.amount_min,
                    // @ts-ignore
                    amount_max: m.subsidies.amount_max,
                    match_score: m.match_score,
                    match_reason: m.match_reason,
                    // @ts-ignore
                    deadline: m.subsidies.application_period_end,
                    status: m.status,
                }));
                setMatches(formatted);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function runMatcher() {
        setMatching(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (!profile?.organization_id) return;

            const result = await matchSubsidies(profile.organization_id);

            if (result.error) {
                setError(result.error);
            } else {
                setMatches(result.matches);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setMatching(false);
        }
    }

    async function handleStatusChange(subsidyId: string, status: string) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!profile?.organization_id) return;

        await updateSubsidyStatus(profile.organization_id, subsidyId, status as any);
        loadMatches();
    }

    if (planLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <PlanGate feature="助成金AIマッチング" requiredPlan="pro" currentPlan={plan}>
            <div className="p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="h-8 w-8 text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-900">助成金AIマッチング</h1>
                    </div>
                    <p className="text-gray-600">
                        AIが貴法人に最適な助成金・補助金を自動で見つけ出します
                    </p>
                </div>

                {/* Action Button */}
                <div className="mb-6">
                    <button
                        onClick={runMatcher}
                        disabled={matching}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {matching ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                AIが分析中...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5" />
                                最新の助成金を検索
                            </>
                        )}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Matches */}
                {matches.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">
                            「最新の助成金を検索」ボタンを押して、マッチングを開始してください
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {matches.map((match) => (
                            <div
                                key={match.subsidy_id}
                                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                            {match.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Building2 className="h-4 w-4" />
                                                {match.provider}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                締切: {new Date(match.deadline).toLocaleDateString('ja-JP')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {Math.round(match.match_score * 100)}%
                                        </div>
                                        <div className="text-xs text-gray-500">適合度</div>
                                    </div>
                                </div>

                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-gray-700 flex items-start gap-2">
                                        <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>{match.match_reason}</span>
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <span className="font-semibold text-gray-700">
                                            ¥{match.amount_min.toLocaleString('ja-JP')}
                                            {' ~ '}
                                            ¥{match.amount_max.toLocaleString('ja-JP')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!match.status || match.status === 'matched' ? (
                                            <>
                                                <button
                                                    onClick={() => handleStatusChange(match.subsidy_id, 'reviewing')}
                                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    詳細確認
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(match.subsidy_id, 'ignored')}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                                                >
                                                    対象外
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`px-4 py-2 text-sm font-semibold rounded-lg ${match.status === 'applied' ? 'bg-yellow-100 text-yellow-800' :
                                                    match.status === 'granted' ? 'bg-green-100 text-green-800' :
                                                        match.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {match.status === 'reviewing' && '確認中'}
                                                {match.status === 'applied' && '申請済み'}
                                                {match.status === 'granted' && '✅ 受給決定'}
                                                {match.status === 'rejected' && '不採択'}
                                                {match.status === 'ignored' && '対象外'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PlanGate>
    );
}
