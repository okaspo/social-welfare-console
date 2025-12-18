-- Fix RLS Policies to prevent infinite recursion and allow own-read
-- Date: 2025-12-18

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Super Admins can manage admin_roles" ON public.admin_roles;

-- 2. Basic Policy: Users can ALWAYS read their own role (Terminates recursion)
CREATE POLICY "Users can read own role"
    ON public.admin_roles
    FOR SELECT
    USING ( user_id = auth.uid() );

-- 3. Super Admin Policy: Can read/write ALL rows
-- This uses a subquery, but since "Users can read own role" exists, 
-- the recursive check for "Am I a super admin?" will succeed via that basic policy.
CREATE POLICY "Super Admins can manage all"
    ON public.admin_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );
