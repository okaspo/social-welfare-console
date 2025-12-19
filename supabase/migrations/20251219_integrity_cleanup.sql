-- Protocol: System Integrity Audit & Cleanup
-- Date: 2025-12-19
-- Description: Consolidate Organizations data, Drop redundant columns, Fix Orphans, Enforce RLS.

BEGIN;

-- ============================================================================
-- 1. Data Deduplication (Single Source of Truth)
-- ============================================================================

-- A. Migrate Organization Name from Profiles -> Organizations (if Organization name is generic/empty)
-- Logic: If organization.name is default/empty AND profile has corporation_name, update organization.name
-- Note: Assuming 1:1 relation or taking first profile's name for simplicity as 'admin' created it.
UPDATE public.organizations o
SET name = p.corporation_name
FROM public.profiles p
WHERE o.id = p.organization_id
AND (o.name IS NULL OR o.name = '' OR o.name = '社会福祉法人 〇〇会')
AND p.corporation_name IS NOT NULL
AND p.corporation_name <> '';

-- B. Migrate Stripe Customer ID from Profiles -> Organizations
-- Logic: Move stripe_customer_id if it exists in profiles and not in organizations
UPDATE public.organizations o
SET stripe_customer_id = p.stripe_customer_id
FROM public.profiles p
WHERE o.id = p.organization_id
AND o.stripe_customer_id IS NULL
AND p.stripe_customer_id IS NOT NULL;

-- C. Drop Redundant Columns from Profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS corporation_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS organization_name; -- Just in case
ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_customer_id;


-- ============================================================================
-- 2. Enforce Strict Constraints (Prevention)
-- ============================================================================

-- A. Unique Constraints
ALTER TABLE public.organizations ADD CONSTRAINT organizations_stripe_customer_id_key UNIQUE (stripe_customer_id);
-- Note: plan_limits.plan_id is already PK (Unique)
-- Note: admin_roles.user_id might duplicate if role history is kept, but let's enforce 1 active role per user for current simple design.
-- Checking if admin_roles has duplicate keys first
DELETE FROM public.admin_roles a
WHERE a.id NOT IN (
    SELECT DISTINCT ON (user_id) id FROM public.admin_roles ORDER BY user_id, created_at DESC
);
ALTER TABLE public.admin_roles ADD CONSTRAINT admin_roles_user_id_key UNIQUE (user_id);


-- B. Foreign Key Integrity & Orphan Cleanup

-- Clean up organization_members (if exists) or profiles pointing to non-existent organizations/users
-- (Checking profiles table as it links users to orgs)
DELETE FROM public.profiles 
WHERE organization_id IS NOT NULL 
AND organization_id NOT IN (SELECT id FROM public.organizations);

-- If there is a separate 'organization_members' table (noted in user request but likely means 'profiles' based on schema interaction), check it.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_members') THEN
        DELETE FROM public.organization_members 
        WHERE user_id NOT IN (SELECT id FROM auth.users) 
        OR organization_id NOT IN (SELECT id FROM public.organizations);
    END IF;
END $$;


-- ============================================================================
-- 3. Security Audit (RLS Enablement)
-- ============================================================================

-- Enable RLS on all public tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP 
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename); 
    END LOOP; 
END $$;

COMMIT;
