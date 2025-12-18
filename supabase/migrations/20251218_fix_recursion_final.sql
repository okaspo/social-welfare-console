-- 1. Create Security Definer Function to bypass RLS for checks
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    );
$$;

-- 2. Clean up Policies
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can manage admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can view admin_roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.admin_roles;
DROP POLICY IF EXISTS "Super Admins can manage all" ON public.admin_roles;
DROP POLICY IF EXISTS "Read Own Role" ON public.admin_roles;
DROP POLICY IF EXISTS "Super Admin Full Access" ON public.admin_roles;

-- 3. Define Non-Recursive Policies
-- Policy A: Users can read their own row (Basic access)
CREATE POLICY "Read Own Role"
ON public.admin_roles
FOR SELECT
USING (user_id = auth.uid());

-- Policy B: Super Admins can do everything (Uses function to break recursion)
CREATE POLICY "Super Admin Full Access"
ON public.admin_roles
FOR ALL
USING (is_super_admin());

-- 4. Grant User (Idempotent)
INSERT INTO public.admin_roles (user_id, role)
VALUES ('d0235961-f916-4f70-befd-38b2a3813cea', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
