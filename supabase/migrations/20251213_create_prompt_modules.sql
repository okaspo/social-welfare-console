-- 1. Create prompt_modules table
CREATE TABLE public.prompt_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    required_plan_level INTEGER NOT NULL, -- 0:Free, 1:Standard, 2:Pro, 3:Enterprise
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add plan_id to organizations (if not exists, or ensuring it exists)
-- Checking if column exists first to be safe, or just ADD COLUMN IF NOT EXISTS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'plan_id') THEN
        ALTER TABLE public.organizations ADD COLUMN plan_id TEXT DEFAULT 'free';
    END IF;
END $$;

-- Migration: Sync existing 'plan' column to 'plan_id' if needed (assuming 'plan' stores similar values)
-- Lowercasing to match usage 'free', 'standard' etc.
UPDATE public.organizations 
SET plan_id = LOWER(plan) 
WHERE plan_id IS NULL OR plan_id = 'free'; -- Only update if valid

-- 3. RLS for prompt_modules
ALTER TABLE public.prompt_modules ENABLE ROW LEVEL SECURITY;

-- Read: Authenticated users can read
CREATE POLICY "Authenticated users can read prompt_modules" ON public.prompt_modules
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Write: Service Role only (Admin)
CREATE POLICY "Service role can manage prompt_modules" ON public.prompt_modules
    FOR ALL
    USING (auth.role() = 'service_role');


-- 4. Initial Data Seeding
-- Upsert to avoid duplicates on multiple runs
INSERT INTO public.prompt_modules (slug, name, content, required_plan_level)
VALUES
    (
        'mod_core',
        'Base Layer (Core Personality)',
        'あなたは社会福祉法人運営の専門家「葵（あおい）」です。常に丁寧で落ち着いたトーンで話し、法令に基づく正確な助言を行います。ユーザーの質問には、まず結論から述べ、その後に詳細な説明を加えてください。',
        0 -- Free
    ),
    (
        'mod_std',
        'Standard Module (Basic Document Support)',
        '議事録や基本的な申請書類の作成サポートが可能です。作成する文書は、厚生労働省の最新のガイドラインに準拠した形式で出力してください。不明確な情報はユーザーに確認し、勝手に補完しないでください。',
        1 -- Standard
    ),
    (
        'mod_pro',
        'Pro Module (Advanced Legal Checking)',
        '作成された議事録や契約書に対して、社会福祉法および関連通知に基づく法的チェックを行います。リスクがある条項や、記載漏れの可能性がある項目については、具体的に指摘し、修正案を提示してください。',
        2 -- Pro
    ),
    (
        'mod_ent',
        'Enterprise Module (Audit & Strategy)',
        '法人全体の運営状況を踏まえた、監査対応および中長期的な経営戦略に関する助言を行います。過去の是正指導事例や、最新の法改正動向を考慮し、経営リスクを最小化するためのプロアクティブな提案を行ってください。',
        3 -- Enterprise
    )
ON CONFLICT (slug) 
DO UPDATE SET 
    content = EXCLUDED.content,
    required_plan_level = EXCLUDED.required_plan_level,
    name = EXCLUDED.name;
