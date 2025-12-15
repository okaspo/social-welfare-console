
import { createClient } from '@/lib/supabase/server';

/**
 * Builds the system prompt by stacking layers based on Plan ID.
 * Layer 1: Persona (Aoi) - Always present (or fetch from DB)
 * Layer 2: Functional Modules (Dependent on Plan) - e.g. mod_std, mod_pro
 * Layer 3: User Context - Injected based on user profile
 * 
 * @param planId 'free' | 'standard' | 'pro' | 'enterprise'
 * @param userId Optional user ID to inject personalization context
 */
export async function buildSystemPrompt(planId: string = 'free', userId?: string): Promise<string> {
    const supabase = await createClient();

    // Define Plan Levels
    const PLAN_LEVELS: Record<string, number> = {
        'free': 0,
        'standard': 1,
        'pro': 2,
        'enterprise': 3
    };
    const currentLevel = PLAN_LEVELS[planId] || 0;

    // Fetch necessary modules
    // We fetch 'mod_persona' + any module where required_plan_level <= currentLevel
    const { data: modules, error } = await supabase
        .from('prompt_modules')
        .select('slug, content, required_plan_level')
        .eq('is_active', true)
        .order('required_plan_level', { ascending: true });

    if (error) {
        console.error('Failed to fetch prompt modules:', error);
        return "System Error: Could not load prompt configuration.";
    }

    // Stack them
    // 1. Persona (Always Top)
    const persona = modules?.find(m => m.slug === 'mod_persona')?.content || "";

    // 2. Functional Modules (Filtered by Plan)
    const functionalModules = modules
        ?.filter(m => m.slug !== 'mod_persona' && m.required_plan_level <= currentLevel)
        .map(m => m.content)
        .join('\n\n') || "";

    // 3. User Context (if userId provided)
    let userContext = '';
    if (userId) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, job_title, age_group, gender, corporation_name')
            .eq('id', userId)
            .single();

        if (profile) {
            const contextParts = ['---', 'User Context:'];
            if (profile.full_name) contextParts.push(`- Name: ${profile.full_name}`);
            if (profile.job_title) contextParts.push(`- Role: ${profile.job_title}`);
            if (profile.age_group) contextParts.push(`- Age Group: ${profile.age_group}`);
            if (profile.corporation_name) contextParts.push(`- Organization: ${profile.corporation_name}`);

            userContext = '\n\n' + contextParts.join('\n');
        }
    }

    // Concatenate
    return `
${persona}

${functionalModules}${userContext}
`.trim();
}
