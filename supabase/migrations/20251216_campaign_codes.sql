-- Create campaign_codes table for advanced promotion management
CREATE TABLE IF NOT EXISTS public.campaign_codes (
    code text PRIMARY KEY,
    description text,
    discount_percent integer, -- For display/reference purposes
    target_plan_id text REFERENCES public.plan_limits(plan_id),
    expires_at timestamp with time zone,
    max_uses integer,
    current_uses integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.campaign_codes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage campaign codes" ON public.campaign_codes
    FOR ALL USING (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- Public can read active codes (for validation) - strictly speaking only needed by API, 
-- but might be useful for client-side validation if needed. 
-- For security, usually validation is done server-side via RPC or API route with service role.
-- So we won't add a public read policy for now.

-- Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_campaign_usage(code_input text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.campaign_codes
    SET current_uses = current_uses + 1
    WHERE code = code_input;
END;
$$;
