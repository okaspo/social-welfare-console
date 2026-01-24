-- マルチテナント分離の修正: organization_idがNULLの場合のRLSポリシー強化
-- 
-- 問題: organization_idがNULLのユーザーは、他法人のデータを閲覧できる可能性があった
-- 解決: NULL organization_idを明示的に除外するRLSポリシーに変更

-- 1. 既存のポリシーを削除
DROP POLICY IF EXISTS "Members can view colleagues" ON profiles;

-- 2. 強化されたポリシーを作成
-- NULL organization_idを明示的に除外
CREATE POLICY "Members can view colleagues" ON profiles
    FOR SELECT
    USING (
        -- 自分のプロフィールは常に閲覧可能
        id = auth.uid()
        OR
        -- 同じ組織のメンバーは閲覧可能（NULLは除外）
        (
            organization_id IS NOT NULL 
            AND organization_id = (
                SELECT organization_id 
                FROM profiles 
                WHERE id = auth.uid() 
                AND organization_id IS NOT NULL
            )
        )
    );

-- 3. 確認用コメント
COMMENT ON POLICY "Members can view colleagues" ON profiles IS 
    'ユーザーは自分のプロフィールと、同じorganization_idを持つプロフィールのみ閲覧可能。NULLのorganization_idは他のNULLとマッチしない。';

