-- Multi-Entity Support Architecture
-- Enable expansion to NPO, Medical Corps, and General Incorporated Associations
-- Date: 2025-12-16

-- ============================================================================
-- 1. Add Entity Type to Organizations
-- ============================================================================

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS entity_type TEXT 
    CHECK (entity_type IN (
        'social_welfare',  -- 社会福祉法人
        'medical_corp',    -- 医療法人
        'npo',             -- NPO法人
        'general_inc'      -- 一般社団法人
    )) DEFAULT 'social_welfare' NOT NULL;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_organizations_entity_type ON organizations(entity_type);

COMMENT ON COLUMN organizations.entity_type IS 'Legal entity type: social_welfare, medical_corp, npo, general_inc';

-- ============================================================================
-- 2. Add Entity Type Targeting to Common Knowledge
-- ============================================================================

ALTER TABLE common_knowledge
ADD COLUMN IF NOT EXISTS target_entity_types TEXT[] DEFAULT ARRAY['social_welfare'];

-- GIN index for array queries
CREATE INDEX IF NOT EXISTS idx_knowledge_entity_types ON common_knowledge USING GIN(target_entity_types);

COMMENT ON COLUMN common_knowledge.target_entity_types IS 'Array of entity types this knowledge applies to. Use @> or && for filtering.';

-- Update existing knowledge to be tagged for social_welfare
UPDATE common_knowledge
SET target_entity_types = ARRAY['social_welfare']
WHERE target_entity_types IS NULL OR target_entity_types = ARRAY[]::TEXT[];

-- ============================================================================
-- 3. Relax Officers Role Constraint for Multi-Entity Support
-- ============================================================================

-- Drop existing constraint (too restrictive for different entity types)
ALTER TABLE officers
DROP CONSTRAINT IF EXISTS officers_role_check;

-- Add comment explaining entity-specific validation
COMMENT ON COLUMN officers.role IS 'Officer role code. Valid values depend on organization.entity_type. See src/lib/entity/config.ts for mappings.';

-- ============================================================================
-- 4. Helper Function: Get Entity-Aware Role Label
-- ============================================================================

CREATE OR REPLACE FUNCTION get_role_label(
    p_entity_type TEXT,
    p_role_code TEXT
)
RETURNS TEXT AS $$
BEGIN
    -- Social Welfare
    IF p_entity_type = 'social_welfare' THEN
        CASE p_role_code
            WHEN 'director' THEN RETURN '理事';
            WHEN 'auditor' THEN RETURN '監事';
            WHEN 'councilor' THEN RETURN '評議員';
            WHEN 'selection_committee' THEN RETURN '評議員選任解任委員';
            ELSE RETURN p_role_code;
        END CASE;
    
    -- NPO
    ELSIF p_entity_type = 'npo' THEN
        CASE p_role_code
            WHEN 'director' THEN RETURN '理事';
            WHEN 'auditor' THEN RETURN '監事';
            ELSE RETURN p_role_code;
        END CASE;
    
    -- Medical Corporation
    ELSIF p_entity_type = 'medical_corp' THEN
        CASE p_role_code
            WHEN 'director' THEN RETURN '理事';
            WHEN 'auditor' THEN RETURN '監事';
            WHEN 'member' THEN RETURN '社員';
            ELSE RETURN p_role_code;
        END CASE;
    
    -- General Incorporated Association
    ELSIF p_entity_type = 'general_inc' THEN
        CASE p_role_code
            WHEN 'director' THEN RETURN '理事';
            WHEN 'auditor' THEN RETURN '監事';
            WHEN 'member' THEN RETURN '社員';
            ELSE RETURN p_role_code;
        END CASE;
    
    ELSE
        RETURN p_role_code;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_role_label IS 'Returns localized role label based on entity type and role code';

-- ============================================================================
-- 5. Helper Function: Get Entity-Aware Term Years
-- ============================================================================

CREATE OR REPLACE FUNCTION get_role_term_years(
    p_entity_type TEXT,
    p_role_code TEXT
)
RETURNS INTEGER AS $$
BEGIN
    -- Social Welfare
    IF p_entity_type = 'social_welfare' THEN
        CASE p_role_code
            WHEN 'director' THEN RETURN 2;
            WHEN 'auditor' THEN RETURN 4;
            WHEN 'councilor' THEN RETURN 4;
            WHEN 'selection_committee' THEN RETURN 4;
            ELSE RETURN 2;
        END CASE;
    
    -- NPO
    ELSIF p_entity_type = 'npo' THEN
        CASE p_role_code
            WHEN 'director' THEN RETURN 2;
            WHEN 'auditor' THEN RETURN 2;
            ELSE RETURN 2;
        END CASE;
    
    -- Medical Corporation
    ELSIF p_entity_type = 'medical_corp' THEN
        CASE p_role_code
            WHEN 'director' THEN RETURN 2;
            WHEN 'auditor' THEN RETURN 2;
            WHEN 'member' THEN RETURN 100; -- Effectively indefinite
            ELSE RETURN 2;
        END CASE;
    
    -- General Incorporated Association
    ELSIF p_entity_type = 'general_inc' THEN
        CASE p_role_code
            WHEN 'director' THEN RETURN 2;
            WHEN 'auditor' THEN RETURN 2;
            WHEN 'member' THEN RETURN 100;
            ELSE RETURN 2;
        END CASE;
    
    ELSE
        RETURN 2;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_role_term_years IS 'Returns default term length in years based on entity type and role code';
