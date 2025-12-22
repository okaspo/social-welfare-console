-- Fix admin_roles RLS to allow users to check their own admin status
-- Date: 2025-12-22

-- Drop the restrictive policy that requires being admin to check admin status
DROP POLICY IF EXISTS "Admins can view admin_roles" ON public.admin_roles;

-- Allow any authenticated user to check if they are an admin (only their own record)
CREATE POLICY "Users can check their own admin status"
    ON public.admin_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Super Admins can still manage all admin roles
-- (This policy should already exist, but let's ensure it)
DROP POLICY IF EXISTS "Super Admins can manage admin_roles" ON public.admin_roles;
CREATE POLICY "Super Admins can manage admin_roles"
    ON public.admin_roles
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_roles WHERE role = 'super_admin'
        )
    );

-- Ensure the user is in admin_roles (update with actual user ID if needed)
-- This is a placeholder; run the SELECT first to get the actual user_id
-- SELECT id, email FROM auth.users WHERE email = 'qubo.jun@gmail.com';
-- INSERT INTO admin_roles (user_id, role) VALUES ('<user_id>', 'super_admin') ON CONFLICT DO NOTHING;
