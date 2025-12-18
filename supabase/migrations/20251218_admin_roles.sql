-- Admin Roles for Internal Staff Management
-- Date: 2025-12-18

-- ============================================================================
-- 1. Create table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'editor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 2. RLS Policies
-- ============================================================================
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Super Admins can manage all admin roles
DROP POLICY IF EXISTS "Super Admins can manage admin_roles" ON public.admin_roles;
CREATE POLICY "Super Admins can manage admin_roles"
    ON public.admin_roles
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_roles WHERE role = 'super_admin'
        )
    );

-- Everyone can read (to check their own permission or internal logic)
-- But effectively, we might want to restrict this.
-- For now, allow read if you are in the table (i.e. you are an admin)
DROP POLICY IF EXISTS "Admins can view admin_roles" ON public.admin_roles;
CREATE POLICY "Admins can view admin_roles"
    ON public.admin_roles
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_roles
        )
    );

-- ============================================================================
-- 3. Initial Seed (Bootstrap)
-- ============================================================================
-- Note: You might want to manually insert your own user ID here or handle it via a bootstrap script.
-- For safety, we won't auto-insert a random ID, but ensuring RLS doesn't lock everyone out is key.
-- (If the table is empty, no one is super_admin, so no one can add row via RLS)
-- We need a "bootstrap" policy or manual SQL execution.

-- Allow initial seed if table is empty (Optional / Dangerous in prod without care)
-- Better: The developer will manually insert the first super_admin.
