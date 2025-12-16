-- Document Templates, Chat Memory & Mobile Optimization
-- Date: 2025-12-16

-- ============================================================================
-- 1. Document Templates Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL, -- Storage URL for .docx/.xlsx template
    category TEXT CHECK (category IN (
        'minutes', 'contract', 'report', 'form', 'letter', 'other'
    )) DEFAULT 'other' NOT NULL,
    allowed_plans TEXT[] DEFAULT ARRAY['free', 'standard', 'pro', 'enterprise'] NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON document_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON document_templates(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE document_templates IS 'Document templates with plan-based access control';
COMMENT ON COLUMN document_templates.allowed_plans IS 'Array of plan IDs that can access this template';

-- Seed Data: Initial Templates
INSERT INTO document_templates (title, description, file_url, category, allowed_plans) VALUES
('理事会議事録テンプレート', '社会福祉法人の理事会議事録フォーマット（基本版）', '/templates/board-minutes-basic.docx', 'minutes', ARRAY['free', 'standard', 'pro', 'enterprise']),
('評議員会議事録テンプレート', '評議員会の議事録フォーマット', '/templates/council-minutes.docx', 'minutes', ARRAY['standard', 'pro', 'enterprise']),
('理事会議事録テンプレート（詳細版）', '詳細な理事会議事録フォーマット（Pro版）', '/templates/board-minutes-pro.docx', 'minutes', ARRAY['pro', 'enterprise']),
('現況報告書テンプレート', '所轄庁提出用の現況報告書（Excel）', '/templates/status-report.xlsx', 'report', ARRAY['pro', 'enterprise']),
('事業計画書テンプレート', '年度事業計画書フォーマット', '/templates/business-plan.docx', 'report', ARRAY['standard', 'pro', 'enterprise']),
('契約書テンプレート（基本）', '一般的な契約書フォーマット', '/templates/contract-basic.docx', 'contract', ARRAY['pro', 'enterprise']);

-- ============================================================================
-- 2. Update Plan Limits for Memory Feature
-- ============================================================================

ALTER TABLE plan_limits
ADD COLUMN IF NOT EXISTS can_use_long_term_memory BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_memory_items INTEGER DEFAULT 0;

COMMENT ON COLUMN plan_limits.can_use_long_term_memory IS 'Whether this plan can save chat memories (pin messages)';
COMMENT ON COLUMN plan_limits.max_memory_items IS 'Maximum number of memories that can be saved';

-- Update existing plans with memory quotas
UPDATE plan_limits SET 
    can_use_long_term_memory = FALSE, 
    max_memory_items = 0 
WHERE name = 'Free';

UPDATE plan_limits SET 
    can_use_long_term_memory = TRUE, 
    max_memory_items = 50 
WHERE name = 'Standard';

UPDATE plan_limits SET 
    can_use_long_term_memory = TRUE, 
    max_memory_items = 200 
WHERE name = 'Pro';

UPDATE plan_limits SET 
    can_use_long_term_memory = TRUE, 
    max_memory_items = 1000 
WHERE name = 'Enterprise';

-- ============================================================================
-- 3. Conversation Memories Table (Chat Pinning)
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    source_message_id UUID, -- Reference to original chat message (if applicable)
    pinned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memories_user ON conversation_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_org ON conversation_memories(organization_id);
CREATE INDEX IF NOT EXISTS idx_memories_pinned_at ON conversation_memories(pinned_at DESC);

COMMENT ON TABLE conversation_memories IS 'User-pinned conversation memories for long-term context';
COMMENT ON COLUMN conversation_memories.content IS 'The pinned message content or note';

-- RLS Policies
ALTER TABLE conversation_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memories"
    ON conversation_memories FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create memories"
    ON conversation_memories FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own memories"
    ON conversation_memories FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- 4. Helper Function: Get User Memory Count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_memory_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM conversation_memories
        WHERE user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_memory_count IS 'Returns total number of memories saved by a user (for quota checking)';
