-- Migration: 20251214_finalize_schema.sql
-- Description: Finalize constraints, table renames, and core business logic tables

BEGIN;

-- ============================================================================
-- 1. Table Renaming (Strict Spec Compliance)
-- ============================================================================

-- Rename knowledge_items -> common_knowledge
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_items') THEN
        ALTER TABLE public.knowledge_items RENAME TO common_knowledge;
    END IF;
END $$;

-- Rename documents -> private_documents
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
        ALTER TABLE public.documents RENAME TO private_documents;
    END IF;
END $$;


-- ============================================================================
-- 2. Plan Limits & Configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plan_limits (
    plan_id TEXT PRIMARY KEY,
    monthly_chat_limit INTEGER NOT NULL DEFAULT 20,
    monthly_doc_gen_limit INTEGER NOT NULL DEFAULT 0,
    storage_limit_mb INTEGER NOT NULL DEFAULT 100,
    max_users INTEGER NOT NULL DEFAULT 1,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to plan limits" ON public.plan_limits;
CREATE POLICY "Allow public read access to plan limits" ON public.plan_limits FOR SELECT USING (true);

-- Seed Data
INSERT INTO public.plan_limits (plan_id, monthly_chat_limit, monthly_doc_gen_limit, storage_limit_mb, max_users, features) VALUES
('free', 20, 0, 100, 1, '{"can_download_word": false, "can_use_custom_vectors": false, "can_auto_generate_report": false}'),
('standard', 200, 10, 1000, 3, '{"can_download_word": true, "can_use_custom_vectors": false, "can_auto_generate_report": false}'),
('pro', -1, -1, 10000, 10, '{"can_download_word": true, "can_use_custom_vectors": true, "can_auto_generate_report": true}'),
('enterprise', -1, -1, 100000, 9999, '{"can_download_word": true, "can_use_custom_vectors": true, "can_auto_generate_report": true, "priority_support": true}')
ON CONFLICT (plan_id) DO UPDATE SET
    monthly_chat_limit = EXCLUDED.monthly_chat_limit,
    monthly_doc_gen_limit = EXCLUDED.monthly_doc_gen_limit,
    storage_limit_mb = EXCLUDED.storage_limit_mb,
    max_users = EXCLUDED.max_users,
    features = EXCLUDED.features;


-- ============================================================================
-- 3. Organization Usage Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_usage (
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    current_month DATE NOT NULL,
    chat_count INTEGER NOT NULL DEFAULT 0,
    doc_gen_count INTEGER NOT NULL DEFAULT 0,
    storage_used_mb INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (organization_id, current_month)
);

ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own usage" ON public.organization_usage;
CREATE POLICY "Members can view own usage"
ON public.organization_usage FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);


-- ============================================================================
-- 4. Organization Events (Private Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'meeting', 'audit', etc.
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT FALSE, -- Downgrade Logic
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.organization_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members view events" ON public.organization_events;
CREATE POLICY "Org members view events"
ON public.organization_events FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Org members manage events" ON public.organization_events;
CREATE POLICY "Org members manage events"
ON public.organization_events FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);


-- ============================================================================
-- 5. Updates to Existing Tables
-- ============================================================================

-- common_knowledge (formerly knowledge_items) extension
ALTER TABLE public.common_knowledge
ADD COLUMN IF NOT EXISTS valid_region TEXT;

-- private_documents (formerly documents) extension
ALTER TABLE public.private_documents
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- organizations extension
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS org_type TEXT NOT NULL DEFAULT 'social_welfare',
ADD COLUMN IF NOT EXISTS jurisdiction_area TEXT;


-- ============================================================================
-- 6. RLS Policies Update (Strict Check)
-- ============================================================================

-- Updated RLS for private_documents (renamed from documents)
DROP POLICY IF EXISTS "Users can view docs of own org" ON public.private_documents;
DROP POLICY IF EXISTS "Users can insert docs to own org" ON public.private_documents;
DROP POLICY IF EXISTS "Users can update docs of own org" ON public.private_documents;
DROP POLICY IF EXISTS "Users can delete docs of own org" ON public.private_documents;

CREATE POLICY "Users can view docs of own org"
ON public.private_documents FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert docs to own org"
ON public.private_documents FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update docs of own org"
ON public.private_documents FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete docs of own org"
ON public.private_documents FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);


-- ============================================================================
-- 7. Prompt Modules (Add Persona)
-- ============================================================================
-- Ensure mod_persona exists in prompt_modules
INSERT INTO public.prompt_modules (slug, name, content, required_plan_level)
VALUES
(
    'mod_persona',
    'Persona Layer (Aoi)',
    '【役割定義】社会福祉法人専門 S級AI事務局 葵さん\nあなたは、社会福祉法人の制度に精通したS級AI事務局です...',
    0 -- Free
)
ON CONFLICT (slug) DO UPDATE SET
    content = EXCLUDED.content;

COMMIT;
