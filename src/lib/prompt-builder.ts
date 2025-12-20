import { createClient } from '@/lib/supabase/server';
import { getEntityConfig, type EntityType } from '@/lib/entity/config';
import { getPersonaFromDB, buildPersonaPrompt } from '@/lib/ai/persona';

/**
 * Builds the system prompt by stacking layers based on Plan ID and Entity Type.
 * Layer 1: Persona (Variable based on Entity)
 * Layer 2: Entity-Specific Law Module - Based on organization entity_type
 * Layer 3: Functional Modules - Dependent on Plan
 * Layer 4: Entity Context - Organization type information
 * Layer 5: User Context - Injected based on user profile
 */
export async function buildSystemPrompt(
    planId: string = 'free',
    userId?: string,
    organizationId?: string
): Promise<string> {
    const supabase = await createClient();

    // Define Plan Levels
    const PLAN_LEVELS: Record<string, number> = {
        'free': 0,
        'standard': 1,
        'pro': 2,
        'enterprise': 3
    };
    const currentLevel = PLAN_LEVELS[planId] || 0;

    // Determine entity type
    let entityType: EntityType = 'social_welfare';
    if (organizationId) {
        const { data: org } = await supabase
            .from('organizations')
            .select('entity_type')
            .eq('id', organizationId)
            .single();

        entityType = (org?.entity_type as EntityType) || 'social_welfare';
    }

    const entityConfig = getEntityConfig(entityType);
    const persona = await getPersonaFromDB(entityType);

    // Fetch necessary modules (excluding persona slug since we use dynamic persona)
    const { data: modules, error } = await supabase
        .from('prompt_modules')
        .select('slug, content, required_plan_level, entity_type')
        .eq('is_active', true)
        .eq('entity_type', entityType)
        .order('required_plan_level', { ascending: true });

    if (error) {
        console.error('Failed to fetch prompt modules:', error);
        // Do not crash, continue with defaults
    }

    // Stack them
    // 1. Dynamic Persona
    const personaPrompt = buildPersonaPrompt(persona);

    // 2. Entity-Specific Law Module
    // Fallback to empty if not found in table, but ideally should be there.
    const lawModule = modules?.find(m => m.slug === entityConfig.promptModules?.lawModule)?.content || "";

    // 3. Functional Modules
    const functionalModules = modules
        ?.filter(m =>
            m.slug !== 'mod_persona' &&
            !m.slug.startsWith('mod_law') && // Exclude law modules logic if separated
            (entityConfig.promptModules?.functionalModules?.includes(m.slug) || true) && // Relax filter for now
            m.required_plan_level <= currentLevel
        )
        .map(m => m.content)
        .join('\n\n') || "";

    // 4. Entity Context
    const entityContext = `
---
Entity Context:
- Type: ${entityConfig.name} (${entityConfig.nameEn})
- Legal Basis: ${entityConfig.legalBasis}
- Assistant: ${persona.name} (${persona.role})
`.trim();

    // 5. User Context (if userId provided)
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

    // Concatenate all layers
    return `
${personaPrompt}

${lawModule}

${functionalModules}

${entityContext}${userContext}
`.trim();
}
