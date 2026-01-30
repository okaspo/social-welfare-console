-- Fix Schema Permissions: Grant USAGE on public schema
-- Date: 2026-01-30
-- Issue: "permission denied for schema public" error
-- Root Cause: The 'authenticated' role lacks USAGE permission on the 'public' schema.
-- This is required before accessing any tables within the schema.

-- ============================================================================
-- 1. Grant USAGE on public schema (CRITICAL - Must be done first)
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- 2. Grant Table Permissions
-- ============================================================================
-- Grant all permissions on existing tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on future tables (default privileges)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- ============================================================================
-- 3. Grant Sequence Permissions (Required for INSERT with auto-increment/UUID)
-- ============================================================================
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon;

-- ============================================================================
-- 4. Grant Function Execution Permissions
-- ============================================================================
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon;

-- ============================================================================
-- 5. Verify RLS Helper Functions are accessible
-- ============================================================================
-- These functions are critical for RLS policies to work
GRANT EXECUTE ON FUNCTION public.rls_get_user_org_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_is_admin_user(UUID) TO authenticated;

