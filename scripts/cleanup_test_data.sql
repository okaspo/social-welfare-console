-- ====================================================
-- Test Data Cleanup Script
-- 実行前に必ずバックアップを取るか、SELECT文で対象を確認してください。
-- ====================================================

BEGIN;

-- 1. Remove "Test" / "Foo" / "Bar" records
-- Organizations
DELETE FROM public.organizations 
WHERE name ILIKE 'test' 
   OR name ILIKE 'foo' 
   OR name ILIKE 'bar' 
   OR name ILIKE 'sample';

-- Profiles (Users)
DELETE FROM public.profiles 
WHERE full_name ILIKE 'test' 
   OR full_name ILIKE 'foo' 
   OR full_name ILIKE 'bar'
   OR full_name ILIKE 'sample';

-- Articles
DELETE FROM public.articles 
WHERE title ILIKE 'test' 
   OR title ILIKE 'foo' 
   OR title ILIKE 'bar'
   OR title ILIKE 'sample';


-- 2. Clean Invalid Prompt Modules
-- Keep only the official modules (core, std, pro, ent)
DELETE FROM public.prompt_modules
WHERE slug NOT IN ('mod_core', 'mod_std', 'mod_pro', 'mod_ent');


-- 3. Remove Orphaned Records (Linked to deleted parents)

-- Articles belonging to non-existent Organizations
DELETE FROM public.articles
WHERE organization_id IS NOT NULL 
  AND organization_id NOT IN (SELECT id FROM public.organizations);

-- Article Versions belonging to non-existent Articles
DELETE FROM public.article_versions
WHERE article_id NOT IN (SELECT id FROM public.articles);

-- Profiles pointing to non-existent Organizations
UPDATE public.profiles
SET organization_id = NULL
WHERE organization_id IS NOT NULL 
  AND organization_id NOT IN (SELECT id FROM public.organizations);

-- (Optional) Delete Profiles that are orphans if strict consistency is needed
-- DELETE FROM public.profiles WHERE organization_id IS NULL; -- Disabled for safety


COMMIT;
