-- =============================================================================
-- Super Admin Global Access RLS Policy Extension
-- =============================================================================
-- Purpose: Allow super_admin users to access all organization data regardless
--          of entity_type (社会福祉法人, NPO, 医療法人, etc.)
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

-- Drop existing policies if they exist (to recreate with super_admin access)
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Super admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Super admins can update all organizations" ON organizations;

-- New policy: Users can view their own organization OR super_admin can view all
CREATE POLICY "Users can view their organization"
ON organizations
FOR SELECT
USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
);

-- Super admin can update any organization
CREATE POLICY "Super admins can update all organizations"
ON organizations
FOR UPDATE
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Super admin can delete organizations (with caution)
CREATE POLICY "Super admins can delete organizations"
ON organizations
FOR DELETE
USING (is_super_admin());

-- =============================================================================
-- 3. Update RLS Policies for profiles table
-- =============================================================================

DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

-- Users can view profiles in their org OR super_admin can view all
CREATE POLICY "Users can view profiles in their organization"
ON profiles
FOR SELECT
USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
);

-- Super admin can update any profile
CREATE POLICY "Super admins can update all profiles"
ON profiles
FOR UPDATE
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- =============================================================================
-- 4. Update RLS Policies for officers table
-- =============================================================================

DROP POLICY IF EXISTS "Users can view officers in their organization" ON officers;
DROP POLICY IF EXISTS "Super admins can manage all officers" ON officers;

-- Users can view officers in their org OR super_admin can view all
CREATE POLICY "Users can view officers in their organization"
ON officers
FOR SELECT
USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
);

-- Super admin can manage (insert/update/delete) any officer
CREATE POLICY "Super admins can manage all officers"
ON officers
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- =============================================================================
-- 5. Update RLS Policies for meetings table
-- =============================================================================

DROP POLICY IF EXISTS "Users can view meetings in their organization" ON meetings;

CREATE POLICY "Users can view meetings in their organization"
ON meetings
FOR SELECT
USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
);

CREATE POLICY "Super admins can manage all meetings"
ON meetings
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- =============================================================================
-- 6. Update RLS Policies for private_documents table
-- =============================================================================

DROP POLICY IF EXISTS "Users can view documents in their organization" ON private_documents;

CREATE POLICY "Users can view documents in their organization"
ON private_documents
FOR SELECT
USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR is_super_admin()
);

CREATE POLICY "Super admins can manage all documents"
ON private_documents
FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- =============================================================================
-- 7. Update RLS Policies for audit_logs table
-- =============================================================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;

CREATE POLICY "Admins can view audit logs"
ON audit_logs
FOR SELECT
USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'representative', 'auditor'))
    OR is_super_admin()
);

-- =============================================================================
-- 8. Performance Indexes for Admin Dashboard
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

-- Index for profiles organization lookup
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id 
ON profiles (organization_id);

-- Index for officers organization lookup
CREATE INDEX IF NOT EXISTS idx_officers_organization_id_active 
ON officers (organization_id, is_active);

-- =============================================================================
-- 9. Grant execute permission on helper function
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

COMMENT ON INDEX idx_organizations_entity_type_created_at IS 'Optimizes admin dashboard queries filtering by entity_type';
COMMENT ON INDEX idx_organizations_plan_created_at IS 'Optimizes admin dashboard queries filtering by plan';
