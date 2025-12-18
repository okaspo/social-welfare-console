import { PlanGate } from '@/components/billing/plan-gate'
import ChatInterface, { KnowledgeData } from '@/components/chat/chat-interface'
import { ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ChatPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch profile to get organization_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    let knowledge: KnowledgeData | undefined

    if (profile?.organization_id) {
        // Fetch organization name
        const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', profile.organization_id)
            .single()

        // Fetch officer counts
        // Note: We run these in parallel for performance
        const [directorRes, auditorRes, councilorRes] = await Promise.all([
            supabase.from('officers').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).eq('role', 'director'),
            supabase.from('officers').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).eq('role', 'auditor'),
            supabase.from('officers').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).eq('role', 'councilor') // Use 'councilor' not 'council_member' as per form dropdown? Wait, form had 'councilor' value.
        ])
        // Checked form: <option value="councilor">評議員</option>. So 'councilor' is correct.

        knowledge = {
            corporationName: org?.name || '未設定',
            directorCount: directorRes.count || 0,
            auditorCount: auditorRes.count || 0,
            councilorCount: councilorRes.count || 0,
        }
    }

    return (
        <PlanGate
            plan="pro"
            fallback={
                <div className="flex h-[calc(100vh-120px)] items-center justify-center bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-center p-8 max-w-md">
                        <div className="bg-indigo-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="h-10 w-10 text-indigo-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">S級AIアシスタント (Pro版)</h2>
                        <p className="text-gray-500 mb-6">
                            法務知識に基づいた議事録作成、スケジュール提案、契約チェックなどの高度なAI機能はProプランで利用可能です。
                        </p>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-left text-sm space-y-2 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-indigo-500">✓</span>
                                過去の文脈を考慮した長期記憶
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-indigo-500">✓</span>
                                専門的な法務議案書のドラフト作成
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-indigo-500">✓</span>
                                無制限のチャット利用
                            </div>
                        </div>
                        <a href="/dashboard/settings/billing" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                            Proプランにアップグレード
                        </a>
                    </div>
                </div>
            }
        >
            <ChatInterface knowledge={knowledge} />
        </PlanGate>
    )
}

