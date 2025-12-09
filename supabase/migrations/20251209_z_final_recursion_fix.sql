-- FINAL FIX for Infinite Recursion in Profiles RLS
-- This script safely replaces the problematic "Admins can view all profiles" policy
-- with a version that avoids recursion using a SECURITY DEFINER function.

-- 1. Drop the problematic policy (and any previous attempts)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 2. Create/Replace the helper function
-- SECURITY DEFINER means this runs with the privileges of the creator (bypassing RLS),
-- which prevents the "select" inside the function from triggering the RLS policy recursively.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 3. Create the safe policy
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  public.is_admin()
);

-- 4. Ensure other standard policies exist (Idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
