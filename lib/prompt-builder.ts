import { createClient } from '@/lib/supabase/server';
import { PlanType, PromptModule } from '@/lib/types';

// Define module stacking order per plan
const PLAN_MODULES: Record<PlanType, string[]> = {
    'free': ['mod_core'],
    'standard': ['mod_core', 'mod_std'],
    'pro': ['mod_core', 'mod_std', 'mod_pro'],
    'enterprise': ['mod_core', 'mod_std', 'mod_pro', 'mod_ent']
};

export async function buildSystemPrompt(planId: PlanType = 'free'): Promise<string> {
    const supabase = await createClient();

    // Always include Persona
    const requiredKeys = ['persona_aoi', ...PLAN_MODULES[planId]];

    // Fetch modules from DB
    const { data: modules, error } = await supabase
        .from('prompt_modules')
        .select('module_key, content')
        .in('module_key', requiredKeys);

    if (error) {
        console.error('Error fetching prompt modules:', error);
        // Fallback or throw? For now fallback to simple string or throw.
        throw new Error('Failed to load system prompt configuration.');
    }

    if (!modules || modules.length === 0) {
        return "You are a helpful assistant."; // Fallback
    }

    // Sort contents based on the order: Persona -> Core -> [Others]
    // requiredKeys maintains the correct order.
    const sortedContents = requiredKeys.map(key => {
        const mod = modules.find(m => m.module_key === key);
        return mod ? mod.content : '';
    }).filter(c => c !== ''); // Remove missing/empty

    return sortedContents.join('\n\n');
}
