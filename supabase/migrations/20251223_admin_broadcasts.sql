-- Admin Broadcasts System
-- Date: 2025-12-23

-- ============================================================================
-- 1. Create table: admin_broadcasts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    body TEXT NOT NULL, -- Markdown content
    target_filter JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"plan": "pro", "entity_type": "swc"}
    sent_count INTEGER NOT NULL DEFAULT 0,
    sent_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 2. RLS Policies
-- ============================================================================
ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

-- Only Super Admins can insert/view
-- (Assuming we join with admin_roles to verify)

DROP POLICY IF EXISTS "Super Admins can manage broadcasts" ON public.admin_broadcasts;
CREATE POLICY "Super Admins can manage broadcasts"
    ON public.admin_broadcasts
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_roles WHERE role = 'super_admin'
        )
    );
