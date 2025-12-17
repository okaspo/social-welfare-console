-- Dynamic Avatar System
-- Supports seasonal and conditional variations for assistants

CREATE TABLE IF NOT EXISTS public.assistant_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assistant_code TEXT NOT NULL CHECK (assistant_code IN ('aoi', 'aki', 'ami')),
    image_url TEXT NOT NULL,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('default', 'season', 'emotion')),
    condition_value TEXT NOT NULL, -- 'spring', 'summer', 'happy', 'default', etc.
    active_period_start DATE,
    active_period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assistant_avatars ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Public Read (All authenticated users can see avatars)
CREATE POLICY "Everyone can view avatars" ON public.assistant_avatars
    FOR SELECT USING (true);

-- 2. Admin Write (Only admins can manage avatars)
CREATE POLICY "Admins can manage avatars" ON public.assistant_avatars
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Seed Data (Initial Default Avatars - Placeholders)
-- Aoi (Social Welfare)
INSERT INTO public.assistant_avatars (assistant_code, image_url, condition_type, condition_value) VALUES
('aoi', '/avatars/aoi_default.png', 'default', 'default'),
('aoi', '/avatars/aoi_spring.png', 'season', 'spring'),
('aoi', '/avatars/aoi_summer.png', 'season', 'summer');

-- Aki (NPO)
INSERT INTO public.assistant_avatars (assistant_code, image_url, condition_type, condition_value) VALUES
('aki', '/avatars/aki_default.png', 'default', 'default');

-- Ami (Medical)
INSERT INTO public.assistant_avatars (assistant_code, image_url, condition_type, condition_value) VALUES
('ami', '/avatars/ami_default.png', 'default', 'default');
