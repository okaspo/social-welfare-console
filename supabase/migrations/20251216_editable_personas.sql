-- Editable Persona System: Decouple Code Name from Display Name
-- Enable admin GUI updates without code deployment
-- Date: 2025-12-16

-- ============================================================================
-- 1. Update assistant_profiles Schema
-- ============================================================================

-- Drop existing table to recreate with new structure
DROP TABLE IF EXISTS assistant_profiles CASCADE;

CREATE TABLE assistant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type_key TEXT UNIQUE NOT NULL CHECK (entity_type_key IN (
        'social_welfare', 'npo', 'general_inc', 'medical_corp'
    )),
    
    -- Internal identifier (immutable - used in code/file paths)
    code_name TEXT UNIQUE NOT NULL,
    
    -- User-facing labels (editable via admin UI)
    display_name TEXT NOT NULL,
    catchphrase TEXT,
    
    -- Personality & Appearance
    personality_prompt_slug TEXT,
    avatar_image_url TEXT,
    ui_theme_color TEXT DEFAULT 'blue',
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assistant_profiles_code ON assistant_profiles(code_name);

COMMENT ON TABLE assistant_profiles IS 
    'AI assistant personas with editable display names. code_name is immutable (for file paths), display_name is editable (for UI).';

COMMENT ON COLUMN assistant_profiles.code_name IS 
    'Immutable internal identifier (e.g., "aoi", "aki", "ami"). Used for file paths and logic.';

COMMENT ON COLUMN assistant_profiles.display_name IS 
    'User-facing display name. Can be changed via admin UI without code deployment.';

-- ============================================================================
-- 2. Seed Data with Temporary Placeholders
-- ============================================================================

INSERT INTO assistant_profiles (
    entity_type_key, 
    code_name, 
    display_name, 
    catchphrase, 
    personality_prompt_slug, 
    ui_theme_color
) VALUES
-- Social Welfare
(
    'social_welfare',
    'aoi',  -- Internal ID (never changes)
    'S級AI事務局 葵',  -- Display name (editable)
    '社会福祉法人の頼れるパートナー',
    'persona_aoi',
    'blue'
),

-- NPO
(
    'npo',
    'aki',  -- Internal ID
    'NPO支援パートナー Aki',  -- Placeholder (Katakana/English mix)
    'NPO活動を熱く支援',
    'persona_aki',
    'orange'
),

-- General Inc (shares Aki persona)
(
    'general_inc',
    'aki',  -- Same code_name as NPO
    '一般社団支援パートナー Aki',
    '非営利活動の伴走者',
    'persona_aki',
    'orange'
),

-- Medical Corp
(
    'medical_corp',
    'ami',  -- Internal ID
    '医療経営AI Ami',  -- Placeholder (Alphabet)
    '医療法人経営の参謀',
    'persona_ami',
    'teal'
);
