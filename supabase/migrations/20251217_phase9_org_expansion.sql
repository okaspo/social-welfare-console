-- Phase 9: Organization Profile Expansion (for Matching)

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS prefecture TEXT, -- e.g., 'tokyo', 'osaka', 'hokkaido'
ADD COLUMN IF NOT EXISTS business_type TEXT; -- e.g., 'elderly_care', 'childcare', 'disability'

-- Validation Check (Optional)
ALTER TABLE public.organizations 
DROP CONSTRAINT IF EXISTS allowed_business_types;

-- Example constraint (can be expanded later)
-- ALTER TABLE public.organizations 
-- ADD CONSTRAINT allowed_business_types CHECK (business_type IN ('elderly_care', 'childcare', 'disability', 'other'));
