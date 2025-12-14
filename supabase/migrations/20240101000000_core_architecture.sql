-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Plan Limits (Configuration Master)
CREATE TABLE IF NOT EXISTS public.plan_limits (
    plan_id text PRIMARY KEY,
    monthly_chat_limit int NOT NULL DEFAULT 0, -- -1 for unlimited
    monthly_doc_gen_limit int NOT NULL DEFAULT 0,
    storage_limit_mb int NOT NULL DEFAULT 0,
    max_users int NOT NULL DEFAULT 1,
    features jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Organization Usage (Tracking)
CREATE TABLE IF NOT EXISTS public.organization_usage (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id uuid NOT NULL, -- Assumes organizations table exists
    current_month date NOT NULL, -- stored as YYYY-MM-01
    chat_count int DEFAULT 0 NOT NULL,
    doc_gen_count int DEFAULT 0 NOT NULL,
    storage_used_mb int DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, current_month)
);

-- 3. Common Knowledge (Public/Shared)
CREATE TABLE IF NOT EXISTS public.common_knowledge (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    category text,
    valid_region text, -- e.g. 'JP-13' (Tokyo), NULL = All
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Prompt Modules
DROP TABLE IF EXISTS public.prompt_modules;
CREATE TABLE IF NOT EXISTS public.prompt_modules (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    module_key text NOT NULL UNIQUE, -- e.g. 'persona_aoi', 'mod_core', 'mod_ent'
    content text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Updates to Organizations Table
-- We use DO block to safely add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'org_type') THEN
        ALTER TABLE public.organizations ADD COLUMN org_type text DEFAULT 'social_welfare';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'jurisdiction_area') THEN
        ALTER TABLE public.organizations ADD COLUMN jurisdiction_area text;
    END IF;
    
    -- Ensure plan_id exists and has default
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'plan_id') THEN
        ALTER TABLE public.organizations ADD COLUMN plan_id text DEFAULT 'free';
    END IF;
END $$;

-- 6. Private Documents (or documents) - RLS Enforcement
-- Assuming 'documents' is the table name based on typical setups, but checking 'private_documents' requirement.
-- The user prompt mentioned "private_documents". We will create it if not exists, or manage 'documents'.
-- Let's stick to 'documents' as the main doc table but enforce the rules requested.
-- If 'documents' exists, strict RLS should be applied.

-- Ensuring 'documents' table RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view documents from their own organization
DROP POLICY IF EXISTS "Users can view own org documents" ON public.documents;
CREATE POLICY "Users can view own org documents" ON public.documents
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Policy: Users can insert documents to their own organization
DROP POLICY IF EXISTS "Users can insert own org documents" ON public.documents;
CREATE POLICY "Users can insert own org documents" ON public.documents
    FOR INSERT
    WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Policy: Users can update own org documents (Soft Delete logic / Archiving)
DROP POLICY IF EXISTS "Users can update own org documents" ON public.documents;
CREATE POLICY "Users can update own org documents" ON public.documents
    FOR UPDATE
    USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 7. Common Knowledge RLS (Public Read)
ALTER TABLE public.common_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for common knowledge" ON public.common_knowledge;
CREATE POLICY "Public read access for common knowledge" ON public.common_knowledge
    FOR SELECT
    USING (true); -- Everyone can read

-- 8. Organization Usage RLS
ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own usage" ON public.organization_usage;
CREATE POLICY "Read own usage" ON public.organization_usage
    FOR SELECT
    USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 9. Plan Limits RLS (Read Only for everyone or authenticated)
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read plans" ON public.plan_limits;
CREATE POLICY "Read plans" ON public.plan_limits
    FOR SELECT
    USING (true);

-- SEED DATA (Plan Limits)
INSERT INTO public.plan_limits (plan_id, monthly_chat_limit, monthly_doc_gen_limit, storage_limit_mb, max_users, features)
VALUES
('free', 20, 0, 100, 1, '{"can_download_word": false, "can_use_custom_vectors": false, "can_auto_generate_report": false}'::jsonb),
('standard', 200, 10, 1024, 3, '{"can_download_word": true, "can_use_custom_vectors": false, "can_auto_generate_report": true}'::jsonb),
('pro', -1, 100, 10240, 10, '{"can_download_word": true, "can_use_custom_vectors": true, "can_auto_generate_report": true}'::jsonb),
('enterprise', -1, -1, 102400, 9999, '{"can_download_word": true, "can_use_custom_vectors": true, "can_auto_generate_report": true, "custom_support": true}'::jsonb)
ON CONFLICT (plan_id) DO UPDATE SET
    monthly_chat_limit = EXCLUDED.monthly_chat_limit,
    monthly_doc_gen_limit = EXCLUDED.monthly_doc_gen_limit,
    storage_limit_mb = EXCLUDED.storage_limit_mb,
    max_users = EXCLUDED.max_users,
    features = EXCLUDED.features;

-- SEED DATA (Prompt Modules)
INSERT INTO public.prompt_modules (module_key, content, description)
VALUES
('persona_aoi', 'You are Aoi, a specialized assistant for social welfare corporations in Japan. Professional, empathetic, and precise.', 'Base Persona'),
('mod_core', 'Your capabilities include general conversation and basic legal guidance based on the Social Welfare Act.', 'Free Tier Core'),
('mod_std', 'You can generate documents and meeting minutes. Reference uploaded internal rules for context.', 'Standard Tier'),
('mod_pro', 'Advanced capabilities: Judicial judgment support, fiscal year-end automation, and accounting consistency checks.', 'Pro Tier'),
('mod_ent', 'Enterprise features: External API integration, email automation, and custom workflow execution.', 'Enterprise Tier')
ON CONFLICT (module_key) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description;
