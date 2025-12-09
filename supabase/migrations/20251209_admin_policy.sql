-- Allow Admins to view all profiles
-- Note: depends on the 'role' column in 'profiles' table.

create policy "Admins can view all profiles"
on public.profiles
for select
using (
  auth.uid() in (
    select id from public.profiles where role = 'admin'
  )
);
