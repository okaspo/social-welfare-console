'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, Play, Edit, RotateCcw } from 'lucide-react'
import { updatePromptModule, testGeneratePrompt } from '@/lib/actions/prompt-admin'

type PromptModule = {
    id: string
    slug: string
    name: string
    content: string
    required_plan_level: number
    is_active: boolean
}

type Props = {
    initialModules: PromptModule[]
}

const PLAN_LEVELS = [
    { level: 0, name: 'Free', color: 'bg-gray-100 text-gray-800' },
    { level: 1, name: 'Standard', color: 'bg-blue-100 text-blue-800' },
    { level: 2, name: 'Pro', color: 'bg-purple-100 text-purple-800' },
    { level: 3, name: 'Enterprise', color: 'bg-indigo-100 text-indigo-800' }
]

export default function PromptConsole({ initialModules }: Props) {
    const router = useRouter()
    const [modules, setModules] = useState(initialModules)
    const [selectedModule, setSelectedModule] = useState<PromptModule | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isTestOpen, setIsTestOpen] = useState(false)
    const [editingContent, setEditingContent] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Test States
    const [testPlan, setTestPlan] = useState('free')
    const [testResult, setTestResult] = useState('')
    const [isTestLoading, setIsTestLoading] = useState(false)

    const handleEdit = (mod: PromptModule) => {
        setSelectedModule(mod)
        setEditingContent(mod.content)
        setIsEditOpen(true)
    }

    const handleSave = async () => {
        if (!selectedModule) return
        setIsLoading(true)

        try {
            const res = await updatePromptModule(selectedModule.id, editingContent)
            if (res.error) {
                alert(res.error)
            } else {
                // Optimistic update
                setModules(prev => prev.map(m => m.id === selectedModule.id ? { ...m, content: editingContent } : m))
                setIsEditOpen(false)
                router.refresh()
            }
        } catch (e) {
            console.error('Update failed', e)
        } finally {
            setIsLoading(false)
        }
    }

    const handleTestGenerate = async () => {
        setIsTestLoading(true)
        setTestResult('')

        try {
            const res = await testGeneratePrompt(testPlan)
            if (res.error) {
                setTestResult('Error: ' + res.error)
            } else {
                setTestResult(res.content || 'No content generated')
            }
        } catch (e) {
            setTestResult('Error: ' + String(e))
        } finally {
            setIsTestLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Prompt Modules</h2>
                    <p className="text-sm text-gray-500">システムプロンプトの構成モジュールを管理します。</p>
                </div>
                <Button onClick={() => setIsTestOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Play className="h-4 w-4 mr-2" />
                    テスト生成
                </Button>
            </div>

            <div className="grid gap-4">
                {modules.map((mod) => {
                    const plan = PLAN_LEVELS.find(p => p.level === mod.required_plan_level) || PLAN_LEVELS[0]
                    return (
                        <Card key={mod.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-bold text-gray-900">{mod.name}</CardTitle>
                                        <Badge variant="outline" className="font-mono text-xs">{mod.slug}</Badge>
                                    </div>
                                    <CardDescription>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${plan.color}`}>
                                            Over {plan.name} Plan
                                        </span>
                                    </CardDescription>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleEdit(mod)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    編集
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-600 font-mono h-20 overflow-hidden relative">
                                    {mod.content}
                                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50 to-transparent p-1"></div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>モジュールの編集: {selectedModule?.name}</DialogTitle>
                        <DialogDescription>
                            AIに与えられる指示（System Prompt）を編集します。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 py-4">
                        <Textarea
                            className="h-full font-mono text-sm leading-relaxed resize-none p-4"
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            保存する
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Test Generator Modal */}
            <Dialog open={isTestOpen} onOpenChange={setIsTestOpen}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>プロンプト生成テスト</DialogTitle>
                        <DialogDescription>
                            プランに応じた結合結果をシミュレーションします。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-4 items-center py-2 px-1">
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={testPlan}
                            onChange={(e) => setTestPlan(e.target.value)}
                        >
                            <option value="free">Free Plan</option>
                            <option value="standard">Standard Plan</option>
                            <option value="pro">Pro Plan</option>
                            <option value="enterprise">Enterprise Plan</option>
                        </select>

                        <Button onClick={handleTestGenerate} disabled={isTestLoading}>
                            {isTestLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                            生成実行
                        </Button>
                    </div>

                    <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-auto border shadow-inner">
                        <pre className="text-gray-100 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                            {testResult || (isTestLoading ? 'Generating...' : 'ここに生成結果が表示されます。')}
                        </pre>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    )
}
