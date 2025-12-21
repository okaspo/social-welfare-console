-- =============================================================================
-- Super Admin Global Access RLS Policy Extension (Simplified)
-- =============================================================================
-- Purpose: Allow super_admin users to access all organization data
-- This version only creates the helper function and basic super_admin policies
-- =============================================================================

-- 1. Helper function to check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_super_admin() IS 'Check if current user has super_admin role';

-- =============================================================================
-- 2. Update RLS Policies for organizations table
-- =============================================================================

DROP POLICY IF EXISTS "Super admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Super admins can update all organizations" ON organizations;
DROP POLICY IF EXISTS "Super admins can delete organizations" ON organizations;

-- Super admin can view any organization
CREATE POLICY "Super admins can view all organizations"
ON organizations
FOR SELECT
USING (is_super_admin());

-- Super admin can update any organization
CREATE POLICY "Super admins can update all organizations"
ON organizations
FOR UPDATE
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Super admin can delete organizations
CREATE POLICY "Super admins can delete organizations"
ON organizations
FOR DELETE
USING (is_super_admin());

-- =============================================================================
-- 3. Super Admin policies for officers table
-- =============================================================================

DROP POLICY IF EXISTS "Super admins can manage all officers" ON officers;

CREATE POLICY "Super admins can view all officers"
ON officers
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can manage all officers"
ON officers
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- =============================================================================
-- 4. Super Admin policies for meetings table
-- =============================================================================

DROP POLICY IF EXISTS "Super admins can manage all meetings" ON meetings;

CREATE POLICY "Super admins can view all meetings"
ON meetings
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can manage all meetings"
ON meetings
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- =============================================================================
-- 5. Performance Indexes for Admin Dashboard
-- =============================================================================

-- Composite index for entity_type + created_at queries
CREATE INDEX IF NOT EXISTS idx_organizations_entity_type_created_at 
ON organizations (entity_type, created_at DESC);

-- Index for plan filtering
CREATE INDEX IF NOT EXISTS idx_organizations_plan_created_at 
ON organizations (plan, created_at DESC);

-- Index for admin_roles lookup (frequently used in is_super_admin)
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id_role 
ON admin_roles (user_id, role);

-- =============================================================================
-- 6. Grant execute permission on helper function
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
