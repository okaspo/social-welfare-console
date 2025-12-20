'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface UserProfile {
    id: string;
    organization_id: string;
    role: string;
    full_name: string;
    organization_name?: string;
    representative_name?: string;
}

interface Subscription {
    id: string;
    plan_id: string;
    status: string;
    stripe_customer_id: string | null;
    features: Record<string, boolean>;
}

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            const supabase = createClient();

            // 1. Get Auth User
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                setLoading(false);
                return;
            }
            setUser(authUser);

            // 2. Get Profile & Organization Plan
            const { data: profileData } = await supabase
                .from('profiles')
                .select(`
                    *,
                    organizations (
                        id,
                        plan,
                        subscription_status,
                        stripe_customer_id,
                        name,
                        representative_name
                    )
                `)
                .eq('id', authUser.id)
                .single();

            if (profileData) {
                const org = Array.isArray(profileData.organizations)
                    ? profileData.organizations[0]
                    : profileData.organizations;

                setProfile({
                    id: profileData.id,
                    organization_id: profileData.organization_id,
                    role: profileData.role,
                    full_name: profileData.full_name,
                    organization_name: org?.name || '',
                    representative_name: org?.representative_name || ''
                });

                if (org) {
                    // 3. Get Plan Features
                    // @ts-ignore
                    const planId = org.plan || 'free';
                    const { data: planLimit } = await supabase
                        .from('plan_limits')
                        .select('features')
                        .eq('plan_id', planId)
                        .single();

                    setSubscription({
                        id: org.id,
                        plan_id: planId,
                        status: org.subscription_status || 'active',
                        stripe_customer_id: org.stripe_customer_id,
                        features: (planLimit?.features as Record<string, boolean>) || {}
                    });
                }
            }
        }

        setLoading(false);
    }

        fetchUser();
}, []);

return {
    user,
    profile,
    subscription,
    loading,
    isAdmin: profile?.role === 'admin'
};
}
