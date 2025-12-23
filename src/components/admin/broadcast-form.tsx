'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, TestTube, Loader2, AlertTriangle, CheckCircle, Users } from 'lucide-react'
import { sendBroadcastEmail, getBroadcastTargetCount, type BroadcastFilters } from '@/lib/actions/admin-broadcast'
import { useRouter } from 'next/navigation'

export default function BroadcastForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [filters, setFilters] = useState<BroadcastFilters>({})
    const [testSent, setTestSent] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [targetCount, setTargetCount] = useState<number | null>(null)

    // Form inputs
    const handleFilterChange = (key: keyof BroadcastFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === 'all' ? undefined : value
        }))
        setTestSent(false) // Reset test status on filter change (safety)
    }

    const handleTestSend = async () => {
        if (!subject || !body) {
            alert('件名と本文を入力してください')
            return
        }

        setIsLoading(true)
        try {
            const res = await sendBroadcastEmail(subject, body, filters, true)
            if (res.success) {
                alert('テストメールを送信しました。内容を確認してください。')
                setTestSent(true)
            } else {
                alert('送信エラー: ' + res.message)
            }
        } catch (e: any) {
            alert('エラー: ' + e.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleBroadcastClick = async () => {
        setIsLoading(true)
        try {
            const count = await getBroadcastTargetCount(filters)
            setTargetCount(count)
            setShowConfirm(true)
        } catch (e: any) {
            alert('対象数の取得に失敗しました: ' + e.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirmSend = async () => {
        setShowConfirm(false)
        setIsLoading(true)
        try {
            const res = await sendBroadcastEmail(subject, body, filters, false)
            if (res.success) {
                alert(`一斉送信が完了しました (送信数: ${res.sentCount})`)
                setSubject('')
                setBody('')
                setTestSent(false)
                router.refresh() // Update history list
            } else {
                alert('送信エラー: ' + res.message)
            }
        } catch (e: any) {
            alert('エラー: ' + e.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Target Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">配信対象プラン</label>
                    <select
                        className="w-full p-2 rounded border border-gray-300 bg-white"
                        onChange={(e) => handleFilterChange('plan', e.target.value)}
                        defaultValue="all"
                    >
                        <option value="all">全プラン</option>
                        <option value="free">Free</option>
                        <option value="standard">Standard</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">法人種別</label>
                    <select
                        className="w-full p-2 rounded border border-gray-300 bg-white"
                        onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                        defaultValue="all"
                    >
                        <option value="all">全法人種別</option>
                        <option value="social_welfare">社会福祉法人</option>
                        <option value="npo">NPO法人</option>
                        <option value="medical_corp">医療法人</option>
                        <option value="general_inc">一般社団法人</option>
                    </select>
                </div>
            </div>

            {/* Editor */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">件名</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="例: 【重要】システムメンテナンスのお知らせ"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                        本文 (Markdown対応)
                    </label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={12}
                        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                        placeholder="# お知らせ&#13;&#10;&#13;&#10;平素よりサービスをご利用いただき..."
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                    {testSent ? (
                        <span className="flex items-center text-green-600 gap-1 font-bold">
                            <CheckCircle className="h-4 w-4" /> テスト送信済み
                        </span>
                    ) : (
                        <span className="flex items-center text-orange-600 gap-1">
                            <AlertTriangle className="h-4 w-4" /> 一斉送信にはテストが必要です
                        </span>
                    )}
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleTestSend}
                        disabled={isLoading || !subject || !body}
                        className="flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                        自分にテスト送信
                    </Button>
                    <Button
                        onClick={handleBroadcastClick}
                        disabled={!testSent || isLoading || !subject || !body}
                        className={`flex items-center gap-2 text-white ${testSent ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        一斉送信
                    </Button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 text-red-600 border-b pb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold">本当に送信しますか？</h3>
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-600 font-medium">以下の条件で一斉メールを送信します。この操作は取り消せません。</p>

                            <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">件名</span>
                                    <span className="font-bold text-gray-900 text-right truncate w-40">{subject}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-gray-500">送信対象数</span>
                                    <span className="flex items-center gap-1 font-bold text-indigo-600 text-lg">
                                        <Users className="h-4 w-4" />
                                        {targetCount} 名
                                    </span>
                                </div>
                                <div className="pt-1">
                                    <span className="text-gray-500 block mb-1">適用フィルター:</span>
                                    <div className="flex gap-2 flex-wrap">
                                        {filters.plan && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Plan: {filters.plan}</span>}
                                        {filters.entity_type && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">Type: {filters.entity_type}</span>}
                                        {!filters.plan && !filters.entity_type && <span className="text-gray-400 text-xs">全ユーザー対象</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setShowConfirm(false)}
                                disabled={isLoading}
                            >
                                キャンセル
                            </Button>
                            <Button
                                onClick={handleConfirmSend}
                                disabled={isLoading}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {targetCount}名に送信を実行
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
