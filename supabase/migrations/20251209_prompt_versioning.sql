-- Add versioning columns to system_prompts
ALTER TABLE public.system_prompts
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN changelog TEXT;

-- Index for efficient version lookup
CREATE INDEX idx_system_prompts_name_version ON public.system_prompts(name, version);
