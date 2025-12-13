-- Fix RLS for system_prompts to ensure visibility
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.system_prompts;
DROP POLICY IF EXISTS "Allow all access to admin users" ON public.system_prompts;

CREATE POLICY "Allow read access to authenticated users"
ON public.system_prompts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow write access to authenticated users"
ON public.system_prompts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
