-- Migration: Allow Super Admin to Update Organizations
-- Date: 2025-12-18

-- Ensure RLS is enabled
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Note: 'Users can view their own organization' already exists for SELECT.
-- We need a policy for UPDATE.

DROP POLICY IF EXISTS "Super Admins can update organizations" ON public.organizations;

CREATE POLICY "Super Admins can update organizations"
  ON public.organizations
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
