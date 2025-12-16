-- Admin Console Multi-Entity Support
-- Enable entity-specific plans, knowledge filtering, and prompt variants
-- Date: 2025-12-16

-- ============================================================================
-- 1. Add Entity Type to Plan Limits
-- ============================================================================

ALTER TABLE plan_limits
ADD COLUMN IF NOT EXISTS target_entity_type TEXT 
    CHECK (target_entity_type IN (
        'social_welfare',  -- 社会福祉法人
        'medical_corp',    -- 医療法人
        'npo',             -- NPO法人
        'general_inc',     -- 一般社団法人
        'all'              -- Universal plans (available to all entities)
    )) DEFAULT 'social_welfare' NOT NULL;

CREATE INDEX IF NOT EXISTS idx_plan_limits_entity_type ON plan_limits(target_entity_type);

COMMENT ON COLUMN plan_limits.target_entity_type IS 
    'Entity type this plan targets. Use "all" for universal plans available to all entity types.';

-- Update existing plans to be universal (backward compatibility)
UPDATE plan_limits
SET target_entity_type = 'all'
WHERE target_entity_type IS NULL OR target_entity_type = 'social_welfare';

-- ============================================================================
-- 2. Add Entity Type to Prompt Modules (Entity-Specific Prompts)
-- ============================================================================

-- Drop unique constraint on slug (allow same slug for different entities)
ALTER TABLE prompt_modules DROP CONSTRAINT IF EXISTS prompt_modules_slug_key;

-- Add entity_type column
ALTER TABLE prompt_modules
ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'social_welfare';

-- Create composite unique constraint (slug + entity_type must be unique together)
ALTER TABLE prompt_modules
ADD CONSTRAINT prompt_modules_slug_entity_unique UNIQUE (slug, entity_type);

CREATE INDEX IF NOT EXISTS idx_prompt_modules_entity ON prompt_modules(entity_type);

COMMENT ON COLUMN prompt_modules.entity_type IS 
    'Entity type this prompt module is for. Enables same slug with different content per entity.';

-- ============================================================================
-- 3. Verify Common Knowledge Has target_entity_types
-- ============================================================================

-- Should already exist from previous migration (20251216_multi_entity_support.sql)
-- Verify and add if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'common_knowledge' 
        AND column_name = 'target_entity_types'
    ) THEN
        ALTER TABLE common_knowledge
        ADD COLUMN target_entity_types TEXT[] DEFAULT ARRAY['social_welfare'];
        
        CREATE INDEX idx_knowledge_entity_types ON common_knowledge USING GIN(target_entity_types);
    END IF;
END $$;

-- ============================================================================
-- 4. Helper Function: Get Plans for Entity Type
-- ============================================================================

CREATE OR REPLACE FUNCTION get_plans_for_entity(p_entity_type TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    monthly_price INTEGER,
    yearly_price INTEGER,
    target_entity_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pl.id,
        pl.name,
        pl.monthly_price,
        pl.yearly_price,
        pl.target_entity_type
    FROM plan_limits pl
    WHERE pl.target_entity_type = p_entity_type
       OR pl.target_entity_type = 'all'
    ORDER BY pl.monthly_price ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_plans_for_entity IS 
    'Returns plans available for a specific entity type (includes universal "all" plans)';
