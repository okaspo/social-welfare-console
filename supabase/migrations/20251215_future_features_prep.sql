-- Future Features Preparation: Custom Domain, Email, and Audit Logs
-- Date: 2025-12-15

-- 1. Add custom domain and email branding fields to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS email_sender_name TEXT DEFAULT 'S級AI事務局 葵';

-- Add comments for documentation
COMMENT ON COLUMN organizations.custom_domain IS 'Custom domain for white-label portal (e.g., portal.example.or.jp)';
COMMENT ON COLUMN organizations.email_sender_name IS 'Customizable sender name for email notifications';

-- 2. Create audit_logs table for security and compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_resource TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
-- Admins can view all logs for their organization
CREATE POLICY "Admins can view organization audit logs" ON audit_logs
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Prevent updates and deletes (audit logs are immutable)
CREATE POLICY "Audit logs are immutable" ON audit_logs
    FOR UPDATE
    USING (false);

CREATE POLICY "Audit logs cannot be deleted" ON audit_logs
    FOR DELETE
    USING (false);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for security and compliance monitoring';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., download_document, update_officer, login)';
COMMENT ON COLUMN audit_logs.target_resource IS 'Resource affected by the action (e.g., document_id_123)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context about the action in JSON format';
