import { createAdminClient } from '@/lib/supabase/admin'
import PromptConsole from '@/components/admin/prompt-console'

export default async function AdminPromptsPage() {
    const supabase = await createAdminClient()

    const { data: modules, error } = await supabase
        .from('prompt_modules')
        .select('*')
        .order('required_plan_level', { ascending: true })

    if (error) {
        return (
            <div className="p-8 text-red-600">
                Error loading prompt modules: {error.message}
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-10">
            <PromptConsole initialModules={modules || []} />
        </div>
    )
}
