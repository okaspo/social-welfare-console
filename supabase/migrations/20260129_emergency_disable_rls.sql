-- EMERGENCY ROLLBACK: DISABLE RLS TEMPORARILY
-- Description: Unblocks write operations by disabling RLS on core tables.
-- This allows the system to function while we debug the policy logic.

-- 1. Disable RLS on core tables where users reported issues
ALTER TABLE public.officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_consents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. (Optional) Re-grant basic permissions just in case
GRANT ALL ON public.officers TO authenticated;
GRANT ALL ON public.meetings TO authenticated;
GRANT ALL ON public.meeting_consents TO authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- 3. Storage buckets (often blocked by RLS too)
-- Note: Assuming storage.objects RLS might be an issue for files, but we can't easily alter system schemas via migration scripts always.
-- Focusing on Data Tables first.
