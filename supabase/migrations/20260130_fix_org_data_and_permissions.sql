-- Fix Organization Data and Grant Service Role Permissions
-- Date: 2026-01-30
-- Description: 
-- 1. Updates the placeholder organization name "社会福祉法人 〇〇会" to "S級AI事務局" to match the sidebar.
-- 2. Grants necessary permissions to the `service_role` to allow admin scripts to function correctly.

-- ============================================================================
-- 1. Grant Permissions to Service Role
-- ============================================================================
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Ensure future tables are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

-- ============================================================================
-- 2. Fix Organization Name Data
-- ============================================================================
UPDATE public.organizations 
SET name = 'S級AI事務局' 
WHERE name = '社会福祉法人 〇〇会';

-- Also update profiles.corporation_name if they match the old name (just in case)
UPDATE public.profiles
SET corporation_name = 'S級AI事務局'
WHERE corporation_name = '社会福祉法人 〇〇会';
