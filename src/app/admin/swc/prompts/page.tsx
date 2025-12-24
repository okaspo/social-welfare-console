import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import PromptConsole from '@/components/admin/prompt-console';

export default async function SwcPromptsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch existing modules
    const { data: modules } = await supabase
        .from('prompt_modules')
        .select('*')
        .order('id');

    return (
        <div className="p-6">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>社会福祉法人コンソール</span>
                    <span>/</span>
                    <span>プロンプト管理</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">システムプロンプト (SWC)</h1>
                <p className="text-gray-600 mt-1">
                    AIの振る舞いを決定するシステムプロンプトモジュールを編集します。
                </p>
            </div>

            <div className="max-w-5xl">
                {/* @ts-ignore */}
                <PromptConsole initialModules={modules || []} />
            </div>
        </div>
    );
}
