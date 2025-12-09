-- ==========================================
-- 統合マイグレーションスクリプト (2025/12/09) - FIX版
-- 修正内容: profilesテーブルにroleカラムを追加
-- ==========================================

-- 0. roleカラムの追加 (存在しない場合)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'general';
    END IF;
END $$;

-- 1. 管理者用RLSポリシーの追加
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- 2. 知識ライブラリへのアーカイブ機能追加
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_items' AND column_name = 'archived_at') THEN
        ALTER TABLE public.knowledge_items ADD COLUMN archived_at timestamp with time zone;
    END IF;
END $$;

-- 3. プロンプトバージョン管理の追加
-- 重複データのクリーンアップ（name='default' などで重複がある場合、最新以外を削除）
-- system_promptsテーブルが存在する場合のみ実行
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_prompts') THEN
        DELETE FROM public.system_prompts
        WHERE id NOT IN (
            SELECT id
            FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY updated_at DESC) as rn
                FROM public.system_prompts
            ) t
            WHERE t.rn = 1
        );
    END IF;
END $$;

-- カラム追加
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_prompts' AND column_name = 'version') THEN
        ALTER TABLE public.system_prompts ADD COLUMN version integer DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_prompts' AND column_name = 'description') THEN
        ALTER TABLE public.system_prompts ADD COLUMN description text;
    END IF;
END $$;

-- 既存データにNULLがある場合は1にする
UPDATE public.system_prompts SET version = 1 WHERE version IS NULL;

-- ユニーク制約追加
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'system_prompts_name_version_key') THEN
        ALTER TABLE public.system_prompts ADD CONSTRAINT system_prompts_name_version_key UNIQUE (name, version);
    END IF;
END $$;
