-- Add versioning columns to system_prompts
ALTER TABLE public.system_prompts
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS changelog TEXT;

-- Index for efficient version lookup
CREATE INDEX IF NOT EXISTS idx_system_prompts_name_version ON public.system_prompts(name, version);
