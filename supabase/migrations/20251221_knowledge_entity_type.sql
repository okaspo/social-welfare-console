-- =============================================================================
-- Add entity_type column to common_knowledge for RAG filtering
-- =============================================================================

-- Add entity_type column to filter knowledge by organization type
ALTER TABLE common_knowledge 
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) DEFAULT 'common';

-- Create index for entity_type filtering
CREATE INDEX IF NOT EXISTS idx_common_knowledge_entity_type 
ON common_knowledge (entity_type, is_active);

-- Comment
COMMENT ON COLUMN common_knowledge.entity_type IS 
'Filters knowledge: common (all), social_welfare, npo, medical_corp';

-- Update existing rows to be 'common' (accessible to all)
UPDATE common_knowledge 
SET entity_type = 'common' 
WHERE entity_type IS NULL;
