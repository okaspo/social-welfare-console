-- Phase 2: Persona Entity Type Association
-- Links assistant personas to organization entity types

-- Add entity_type column to assistant_profiles
ALTER TABLE public.assistant_profiles 
ADD COLUMN IF NOT EXISTS entity_type TEXT 
CHECK (entity_type IN ('social_welfare', 'npo', 'medical_corp'));

-- Add description and full body avatar
ALTER TABLE public.assistant_profiles 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS full_body_url TEXT;

-- Update existing personas with entity_type
UPDATE public.assistant_profiles SET 
    entity_type = 'social_welfare',
    description = '社会福祉法人の法務・ガバナンス支援',
    full_body_url = '/assets/avatars/aoi_full_body.jpg'
WHERE code = 'aoi';

UPDATE public.assistant_profiles SET 
    entity_type = 'npo',
    description = 'NPO法人の運営・会計支援'
WHERE code = 'aki';

UPDATE public.assistant_profiles SET 
    entity_type = 'medical_corp',
    description = '医療法人の経営・労務支援'
WHERE code = 'ami';

COMMENT ON COLUMN public.assistant_profiles.entity_type IS 'Associated organization type: social_welfare, npo, medical_corp';
COMMENT ON COLUMN public.assistant_profiles.description IS 'Short description of the assistant specialty';
COMMENT ON COLUMN public.assistant_profiles.full_body_url IS 'Full body avatar image URL for chat sidebar';
