import { getConcurrentPosts, getOfficerDetails } from './actions'
import ConcurrentPostsManager from '@/components/officers/concurrent-posts-manager'
import Link from 'next/link'
import { ArrowLeft, User, Calendar } from 'lucide-react'

export default async function OfficerDetailPage({ params }: { params: { id: string } }) {
    const officerId = params.id
    const officer = await getOfficerDetails(officerId)
    const concurrentPosts = await getConcurrentPosts(officerId)

    if (!officer) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold">役員が見つかりません</h1>
                <Link href="/swc/dashboard/officers" className="text-blue-600 underline">一覧に戻る</Link>
            </div>
        )
    }

    // Determine Role Label (Simple map)
    const roleMap: Record<string, string> = {
        director: '理事',
        auditor: '監事',
        councilor: '評議員',
        selection_committee: '選任解任委員'
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <Link href="/swc/dashboard/officers" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    役員一覧に戻る
                </Link>
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
                        {officer.name.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{officer.name}</h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-800 font-medium">
                                {roleMap[officer.role] || officer.role}
                            </span>
                            <span className="text-gray-400">ID: {officer.id.slice(0, 8)}...</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    {/* Basic Info (Read Only for now) */}
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-gray-500" />
                            基本情報
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500">任期開始</label>
                                <div className="font-medium">{officer.term_start}</div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">任期満了 (予定)</label>
                                <div className="font-medium">{officer.term_end}</div>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-gray-500">連絡先メールアドレス</label>
                                <div className="font-medium">{officer.email || '未登録'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Concurrent Posts Manager */}
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                        <ConcurrentPostsManager officerId={officerId} initialPosts={concurrentPosts} />
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-gray-50 border rounded-xl p-4">
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            出席率 (直近1年)
                        </h3>
                        <div className="text-3xl font-bold text-indigo-600">100%</div>
                        <p className="text-xs text-gray-500 mt-1">全6回の理事会のうち、6回出席</p>
                    </div>

                    {/* Quick Actions? */}
                </div>
            </div>
        </div>
    )
}
