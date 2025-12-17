import { createClient } from '@/lib/supabase/server';

export async function matchSubsidies(orgId: string) {
    const supabase = await createClient();

    // 1. Fetch Organization Profile
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('entity_type, prefecture, business_type')
        .eq('id', orgId)
        .single();

    if (orgError || !org) {
        console.error('Failed to fetch organization for matching', orgError);
        return;
    }

    // 2. Fetch Active Subsidies
    const { data: subsidies, error: subError } = await supabase
        .from('subsidies')
        .select('*')
        .eq('is_active', true);

    if (subError || !subsidies) {
        console.error('Failed to fetch subsidies', subError);
        return;
    }

    const matches: any[] = [];

    // 3. Comparison Logic
    for (const subsidy of subsidies) {
        let score = 0;
        let isEligible = true;

        // A. Entity Type Check (Must match one)
        // If subsidy has no target entities, assuming all.
        if (subsidy.target_entity_types && subsidy.target_entity_types.length > 0) {
            if (!subsidy.target_entity_types.includes(org.entity_type)) {
                isEligible = false;
            } else {
                score += 1.0; // Base score
            }
        } else {
            score += 0.5; // Broad match
        }

        // B. Region Check
        if (isEligible) {
            if (subsidy.target_regions.includes('all')) {
                score += 0.2; // Weak positive for national
            } else if (org.prefecture && subsidy.target_regions.includes(org.prefecture)) {
                score += 2.0; // Strong positive for regional
            } else {
                isEligible = false;
            }
        }

        // C. Business Type Check
        if (isEligible) {
            if (subsidy.target_business_types.includes('all')) {
                score += 0.1;
            } else if (org.business_type && subsidy.target_business_types.includes(org.business_type)) {
                score += 1.5; // Specific industry match
            } else if (subsidy.target_business_types.length > 0) {
                // If specific types listed but none match
                isEligible = false;
            }
        }

        if (isEligible) {
            // Normalize score to 0.0 - 1.0 range (rough approximation)
            // Max potential score ~4.5
            const finalScore = Math.min(score / 4.0, 1.0);

            matches.push({
                organization_id: orgId,
                subsidy_id: subsidy.id,
                match_score: parseFloat(finalScore.toFixed(2)),
                status: 'matched'
            });
        }
    }

    // 4. Upsert Decisions
    if (matches.length > 0) {
        const { error } = await supabase
            .from('organization_subsidies')
            .upsert(matches, { onConflict: 'organization_id, subsidy_id' });

        if (error) console.error('Failed to save matches', error);
        else console.log(`Saved ${matches.length} matches for org ${orgId}`);
    }
}
