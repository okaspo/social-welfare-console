-- Fix infinite recursion in Admin policy
-- 1. Drop the problematic policy
drop policy if exists "Admins can view all profiles" on public.profiles;

-- 2. Create a SECURITY DEFINER function to safely check admin role
-- This function runs with the privileges of the creator (postgres/superuser usually), bypassing RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- 3. Re-create the policy using the safe function
create policy "Admins can view all profiles"
on public.profiles
for select
using (
  public.is_admin()
);
