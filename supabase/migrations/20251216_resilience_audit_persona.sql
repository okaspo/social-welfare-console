-- System Resilience, Audit Criteria & Multi-Persona AI
-- Date: 2025-12-16

-- ============================================================================
-- 1. System Settings (Maintenance Mode & Backup Status)
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_by UUID REFERENCES auth.users(id)
);

-- Initial settings
INSERT INTO system_settings (key, value, description) VALUES
('maintenance_mode', 'false', 'System-wide maintenance mode flag. Set to "true" to redirect users to maintenance page.'),
('last_backup_at', NULL, 'Timestamp of last successful backup (informational, managed by Supabase PITR)'),
('maintenance_message', 'システムメンテナンス中です。葵/亜美/秋がお休みしています。', 'Custom message shown during maintenance');

COMMENT ON TABLE system_settings IS 'Global system configuration and status flags';

-- ============================================================================
-- 2. Audit Criteria Master (Dynamic Compliance Rules)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_criteria_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_entity_type TEXT CHECK (target_entity_type IN (
        'social_welfare', 'medical_corp', 'npo', 'general_inc', 'all'
    )) NOT NULL,
    category TEXT NOT NULL, -- 'Accounting', 'Governance', 'Labor', 'Operations'
    question TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('High', 'Medium', 'Low')) DEFAULT 'Medium' NOT NULL,
    legal_reference TEXT, -- e.g., "社会福祉法第45条の13"
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    applicable_year INTEGER, -- NULL = all years, 2025 = 2025年度のみ
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_criteria_entity ON audit_criteria_master(target_entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_criteria_active ON audit_criteria_master(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_audit_criteria_year ON audit_criteria_master(applicable_year);
CREATE INDEX IF NOT EXISTS idx_audit_criteria_category ON audit_criteria_master(category);

COMMENT ON TABLE audit_criteria_master IS 
    'Dynamic audit criteria that can be managed via admin console. Enables adapting to regulatory changes without code deployment.';

-- Seed Data: Initial Audit Criteria
INSERT INTO audit_criteria_master (target_entity_type, category, question, severity, legal_reference, applicable_year) VALUES
-- Social Welfare Governance
('social_welfare', 'Governance', '監事に財務の専門家が含まれているか？', 'High', '社会福祉法施行規則', NULL),
('social_welfare', 'Governance', '理事総数の1/3を超えて親族が含まれていないか？', 'High', '社会福祉法第45条の13', NULL),
('social_welfare', 'Governance', '評議員会は年に2回以上開催されているか？', 'Medium', '社会福祉法第45条の9', NULL),

-- Social Welfare Accounting
('social_welfare', 'Accounting', '計算書類は期限内に所轄庁に提出されているか？', 'High', '社会福祉法第45条の27', NULL),
('social_welfare', 'Accounting', '収支計算書と貸借対照表の整合性は確認されているか？', 'High', '社会福祉法人会計基準', NULL),

-- Universal Labor Rules
('all', 'Labor', '労働基準法に基づく36協定は締結されているか？', 'Medium', '労働基準法第36条', NULL),
('all', 'Labor', '就業規則は労働基準監督署に届出されているか？', 'High', '労働基準法第89条', NULL),

-- NPO Specific
('npo', 'Governance', '理事は3名以上選任されているか？', 'High', 'NPO法第15条', NULL),
('npo', 'Accounting', '事業報告書は所轄庁に提出されているか？', 'High', 'NPO法第29条', NULL);

-- ============================================================================
-- 3. Assistant Profiles (Multi-Persona AI System)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assistant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type_key TEXT UNIQUE NOT NULL CHECK (entity_type_key IN (
        'social_welfare', 'npo', 'general_inc', 'medical_corp'
    )),
    name TEXT NOT NULL, -- '葵', '秋', '亜美'
    full_title TEXT NOT NULL,
    personality_summary TEXT,
    personality_prompt_slug TEXT, -- Reference to prompt_modules.slug
    avatar_url TEXT,
    ui_theme_color TEXT DEFAULT 'blue',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE assistant_profiles IS 
    'AI assistant personas tailored to different legal entity types. Enables personalized user experience.';

-- Seed Data: The A-Series AI Assistants
INSERT INTO assistant_profiles (entity_type_key, name, full_title, personality_summary, personality_prompt_slug, ui_theme_color) VALUES
(
    'social_welfare',
    '葵',
    'S級AI事務局 葵',
    '丁寧で冷静、完璧主義な事務のプロフェッショナル。社会福祉法人の運営を正確にサポートします。',
    'persona_aoi',
    'blue'
),
(
    'npo',
    '秋',
    'NPO支援AI 秋',
    '情熱的で応援型のパートナー。NPO法人の活動を伴走支援します。',
    'persona_aki',
    'orange'
),
(
    'general_inc',
    '秋',
    '一般社団支援AI 秋',
    '情熱的で応援型のパートナー。一般社団法人の活動を伴走支援します。',
    'persona_aki',
    'orange'
),
(
    'medical_corp',
    '亜美',
    '医療経営AI 亜美',
    '知的で簡潔、清潔感のある医療秘書。医療法人の経営をスマートにサポートします。',
    'persona_ami',
    'teal'
);
