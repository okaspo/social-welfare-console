// useCurrentPlan Hook
// Get current user's plan for feature gating

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useCurrentPlan() {
    const [plan, setPlan] = useState<string>('free');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlan() {
            const supabase = createClient();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setPlan('free');
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id, organizations(plan_id)')
                .eq('id', user.id)
                .single();

            if (profile?.organizations) {
                // @ts-ignore
                const planId = Array.isArray(profile.organizations)
                    // @ts-ignore
                    ? profile.organizations[0]?.plan_id
                    // @ts-ignore
                    : profile.organizations?.plan_id;
                setPlan(planId || 'free');
            }

            setLoading(false);
        }

        fetchPlan();
    }, []);

    return { plan, loading };
}
