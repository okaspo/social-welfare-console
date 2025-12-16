'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface UserProfile {
    id: string;
    organization_id: string;
    role: string;
    full_name: string;
}

interface Subscription {
    id: string;
    plan_id: string;
    status: string;
    stripe_customer_id: string | null;
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
                        plan_id,
                        subscription_status,
                        stripe_customer_id
                    )
                `)
                .eq('id', authUser.id)
                .single();

            if (profileData) {
                setProfile({
                    id: profileData.id,
                    organization_id: profileData.organization_id,
                    role: profileData.role,
                    full_name: profileData.full_name
                });

                if (profileData.organizations) {
                    // Handle array or single object response depending on relationship definition
                    const org = Array.isArray(profileData.organizations)
                        ? profileData.organizations[0]
                        : profileData.organizations;

                    if (org) {
                        setSubscription({
                            id: org.id,
                            plan_id: org.plan_id || 'free',
                            status: org.subscription_status || 'active',
                            stripe_customer_id: org.stripe_customer_id
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
