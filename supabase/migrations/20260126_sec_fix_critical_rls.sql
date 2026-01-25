-- Critical Security Fix: Enable RLS on Core Tables
-- Date: 2026-01-26
-- Description: Enables RLS on organizations, profiles, and officers to prevent unauthorized access via PostgREST.

-- ============================================================================
-- 1. Helper Function Recap (Ensure they exist by recreating or relying on previous)
-- ============================================================================
-- We rely on public.rls_get_user_org_id(auth.uid()) defined in 20260124_fix_rls_recursion.sql

-- ============================================================================
-- 2. Organizations Table
-- ============================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own organization" ON public.organizations;
CREATE POLICY "Members can view own organization" ON public.organizations
    FOR SELECT
    USING (
        id = public.rls_get_user_org_id(auth.uid())
    );

DROP POLICY IF EXISTS "Admins can update own organization" ON public.organizations;
CREATE POLICY "Admins can update own organization" ON public.organizations
    FOR UPDATE
    USING (
        id = public.rls_get_user_org_id(auth.uid())
        AND public.rls_is_admin_user(auth.uid())
    );

-- ============================================================================
-- 3. Profiles Table (Reinforce)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Note: Policies were largely fixed in 20260124, but we ensure they are active.
-- If 20260124 applied successfully, these might be redundant but safe to re-assert if we use CREATE POLICY IF NOT EXISTS (not standard pg).
-- Instead we assume the previous migration might have failed or been partial.
-- We will NOT drop/create here to avoid conflict if the previous one IS working. 
-- We trust `20260124_fix_rls_recursion.sql` for profiles policies. 
-- BUT we MUST ensure RLS is ENABLED (which was the user's warning).

-- ============================================================================
-- 4. Officers Table
-- ============================================================================
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own org officers" ON public.officers;
CREATE POLICY "Members can view own org officers" ON public.officers
    FOR SELECT
    USING (
        organization_id = public.rls_get_user_org_id(auth.uid())
    );

DROP POLICY IF EXISTS "Admins can manage own org officers" ON public.officers;
CREATE POLICY "Admins can manage own org officers" ON public.officers
    FOR ALL
    USING (
        organization_id = public.rls_get_user_org_id(auth.uid())
        AND public.rls_is_admin_user(auth.uid())
    );

-- ============================================================================
-- 5. Final Lookup Config (Optional but good for security)
-- ============================================================================
-- Ensure no public access to internal IDs if possible, but RLS covers row visibility.
