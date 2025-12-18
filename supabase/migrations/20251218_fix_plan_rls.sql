-- Migration: Fix RLS for Plan Management
-- Date: 2025-12-18
-- Description:
-- 1. Create `is_super_admin()` security definer function to strictly check admin status.
-- 2. Enable RLS on `plan_limits` and `plan_prices`.
-- 3. Define policies: Public/Auth Read, Super Admin Write.

-- 1. Create Helper Function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Plan Limits RLS
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read plan_limits" ON public.plan_limits;
CREATE POLICY "Public read plan_limits"
  ON public.plan_limits
  FOR SELECT
  USING (true); -- Everyone can read plans

DROP POLICY IF EXISTS "Admins can manage plan_limits" ON public.plan_limits;
CREATE POLICY "Admins can manage plan_limits"
  ON public.plan_limits
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 3. Plan Prices RLS
ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read plan_prices" ON public.plan_prices;
CREATE POLICY "Public read plan_prices"
  ON public.plan_prices
  FOR SELECT
  USING (true); -- Everyone can read prices

DROP POLICY IF EXISTS "Admins can manage plan_prices" ON public.plan_prices;
CREATE POLICY "Admins can manage plan_prices"
  ON public.plan_prices
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
