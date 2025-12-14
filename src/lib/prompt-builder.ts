
import { createClient } from '@/lib/supabase/server';

/**
 * Builds the system prompt by stacking layers based on Plan ID.
 * Layer 1: Persona (Aoi) - Always present (or fetch from DB)
 * Layer 2: Functional Modules (Dependent on Plan) - e.g. mod_std, mod_pro
 * 
 * @param planId 'free' | 'standard' | 'pro' | 'enterprise'
 */
export async function buildSystemPrompt(planId: string = 'free'): Promise<string> {
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

    // Concatenate
    return `
${persona}

${functionalModules}
`.trim();
}
