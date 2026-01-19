'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Static avatar paths as fallback
const STATIC_AVATARS: Record<string, string> = {
    aoi: '/assets/avatars/aoi_face_icon.jpg',
    aki: '/assets/avatars/aki_face_icon.jpg',
    ami: '/assets/avatars/ami_face_icon.jpg',
};

export function useAssistantAvatar(assistantCode: string = 'aoi') {
    // Initialize with static fallback immediately to avoid flicker
    const [avatarUrl, setAvatarUrl] = useState<string>(STATIC_AVATARS[assistantCode] || '/assets/avatars/aoi_face_icon.jpg');
    const [fullBodyUrl, setFullBodyUrl] = useState<string>('/assets/avatars/aoi_full_body.jpg');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchAvatar() {
            setLoading(true);

            try {
                // Fetch from assistant_profiles table (managed via admin console)
                const { data: profile, error } = await supabase
                    .from('assistant_profiles')
                    .select('avatar_url, full_body_url')
                    .eq('code', assistantCode)
                    .single();

                if (error) {
                    console.warn('Avatar fetch warning (using fallback):', error.message);
                    setLoading(false);
                    return;
                }

                if (profile) {
                    if (profile.avatar_url) {
                        setAvatarUrl(profile.avatar_url);
                    }
                    if (profile.full_body_url) {
                        setFullBodyUrl(profile.full_body_url);
                    }
                }
            } catch (e) {
                console.warn('Avatar fetch failed (using fallback)', e);
            } finally {
                setLoading(false);
            }
        }

        fetchAvatar();
    }, [assistantCode]);

    return { avatarUrl, fullBodyUrl, loading };
}
