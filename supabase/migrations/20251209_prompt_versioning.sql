-- Add version control columns to system_prompts
ALTER TABLE public.system_prompts
ADD COLUMN version integer DEFAULT 1,
ADD COLUMN description text;

-- Ensure name+version is unique
ALTER TABLE public.system_prompts
ADD CONSTRAINT system_prompts_name_version_key UNIQUE (name, version);

-- Update existing rows to be version 1
UPDATE public.system_prompts SET version = 1 WHERE version IS NULL;
