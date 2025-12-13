import { createAdminClient } from '@/lib/supabase/admin'

const PLAN_LEVELS: Record<string, number> = {
    'free': 0,
    'standard': 1,
    'pro': 2,
    'enterprise': 3
}

export async function buildSystemPrompt(userId: string): Promise<string> {
    const supabase = await createAdminClient()

    // 1. User Plan Lookup
    // Get profile and linked organization to find the plan_id
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
            full_name,
            organization:organizations (
                plan_id
            )
        `)
        .eq('id', userId)
        .single()

    if (profileError || !profile) {
        console.error('Error fetching profile for prompt build:', profileError)
        throw new Error('User profile not found')
    }

    const org = profile.organization as any
    // Default to 'free' if no plan found
    const planId = (org?.plan_id || 'free').toLowerCase()
    const userLevel = PLAN_LEVELS[planId] ?? 0

    // 2. Module Fetching
    // Fetch all active modules where required_plan_level <= userLevel
    const { data: modules, error: modulesError } = await supabase
        .from('prompt_modules')
        .select('content, required_plan_level')
        .eq('is_active', true)
        .lte('required_plan_level', userLevel)
        .order('required_plan_level', { ascending: true })

    if (modulesError) {
        console.error('Error fetching prompt modules:', modulesError)
        // Fallback or throw? Let's throw for now as this is critical
        throw new Error('Failed to load prompt modules')
    }

    if (!modules || modules.length === 0) {
        return "System prompt could not be loaded."
    }

    // 3. Concatenation
    const combinedContent = modules.map(m => m.content).join('\n\n')

    // 4. Context Injection
    const now = new Date().toISOString()
    const userName = profile.full_name || 'User'

    const finalPrompt = `${combinedContent}

---
Context Info:
Current Time: ${now}
User Name: ${userName}
`

    return finalPrompt
}
