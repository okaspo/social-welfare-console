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

            // Fetch from assistant_profiles table (managed via admin console)
            const { data: profile, error } = await supabase
                .from('assistant_profiles')
                .select('avatar_url, full_body_url')
                .eq('code', assistantCode)
                .single();

            if (profile && !error) {
                if (profile.avatar_url) {
                    setAvatarUrl(profile.avatar_url);
                }
                if (profile.full_body_url) {
                    setFullBodyUrl(profile.full_body_url);
                }
            }
            // If DB fails, keep static fallback (already set in useState)

            setLoading(false);
        }

        fetchAvatar();
    }, [assistantCode]);

    return { avatarUrl, fullBodyUrl, loading };
}
