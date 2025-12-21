-- 監事専用読み取りロール追加マイグレーション
-- Adds auditor (监事) role with read-only access

-- 1. profile.role に auditor を追加する前に、既存のenum/constraint確認
-- 実際にはprofiles.roleはtextなので、直接使用可能

-- 2. 監事向けのRLSポリシーを作成

-- 監事が組織のドキュメントを閲覧できるポリシー
CREATE POLICY IF NOT EXISTS "Auditors can view organization documents"
ON private_documents
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() AND role = 'auditor'
    )
);

-- 監事が監査ログを閲覧できるポリシー
CREATE POLICY IF NOT EXISTS "Auditors can view audit logs"
ON audit_logs
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'representative', 'auditor')
    )
);

-- 監事が役員情報を閲覧できるポリシー（既存ポリシーで対応済みの可能性あり）
-- 必要に応じて追加

-- 3. 監事用のヘルパービュー作成
CREATE OR REPLACE VIEW auditor_document_access AS
SELECT 
    pd.id,
    pd.title,
    pd.content,
    pd.document_type,
    pd.created_at,
    pd.updated_at,
    o.name as organization_name
FROM private_documents pd
JOIN organizations o ON pd.organization_id = o.id
WHERE pd.organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'auditor'
);

COMMENT ON VIEW auditor_document_access IS '監事向けドキュメントアクセスビュー（読み取り専用）';
