'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { buildSystemPrompt } from "@/lib/prompt-builder"
import { createClient } from "@/lib/supabase/server"

export async function updatePromptModule(id: string, content: string) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('prompt_modules')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/prompts')
    return { success: true }
}

export async function testGeneratePrompt(planId: string) {
    // We need a dummy user ID or we fake it.
    // buildSystemPrompt requires a userId to lookup the plan.
    // BUT for testing, we might want to bypass the profile lookup and just ask "Use this plan".

    // Changing buildSystemPrompt to optionally accept a planId directly would be cleaner for testing.
    // Let's overload buildSystemPrompt or create a variant?
    // Actually, looking at buildSystemPrompt logic:
    /*
    const planId = (org?.plan_id || 'free').toLowerCase()
    const userLevel = PLAN_LEVELS[planId] ?? 0
    */

    // I will refactor buildSystemPrompt slightly OR just duplicate/mock the logic here for the test.
    // Mocking logic here ensures we test the "Stacking" logic, even if we skip the DB profile lookup.

    const PLAN_LEVELS: Record<string, number> = {
        'free': 0,
        'standard': 1,
        'pro': 2,
        'enterprise': 3
    }

    const userLevel = PLAN_LEVELS[planId] ?? 0

    const supabase = await createAdminClient()
    const { data: modules, error } = await supabase
        .from('prompt_modules')
        .select('content, required_plan_level')
        .eq('is_active', true)
        .lte('required_plan_level', userLevel)
        .order('required_plan_level', { ascending: true })

    if (error) return { error: error.message }

    if (!modules || modules.length === 0) return { content: "No modules found." }

    const combinedContent = modules.map(m => m.content).join('\n\n')

    const now = new Date().toISOString()
    // Mock Context
    const finalPrompt = `${combinedContent}

---
Context Info:
Current Time: ${now}
User Name: Test Admin (Plan: ${planId})
`
    return { content: finalPrompt }
}
