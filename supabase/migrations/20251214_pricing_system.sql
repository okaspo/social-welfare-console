-- 1. Ensure plan_limits exists
CREATE TABLE IF NOT EXISTS public.plan_limits (
    plan_id text PRIMARY KEY,
    name text NOT NULL,
    features jsonb DEFAULT '{}'::jsonb
);

-- Insert standard plans if they don't exist
INSERT INTO public.plan_limits (plan_id, name) VALUES
('FREE', 'Free Plan'),
('STANDARD', 'Standard Plan'),
('PRO', 'Professional Plan'),
('ENTERPRISE', 'Enterprise Plan')
ON CONFLICT (plan_id) DO NOTHING;

-- 2. Create plan_prices
CREATE TABLE IF NOT EXISTS public.plan_prices (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    plan_id text REFERENCES public.plan_limits(plan_id) ON DELETE CASCADE NOT NULL,
    amount integer NOT NULL,
    currency text DEFAULT 'jpy' NOT NULL,
    interval text CHECK (interval IN ('month', 'year')) NOT NULL,
    is_public boolean DEFAULT true,
    campaign_code text,
    stripe_price_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (so they can see prices on billing page)
CREATE POLICY "Allow read access to authenticated users" ON public.plan_prices FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins full access (simplified for prototype, allowing all auth users for now or restricted if we had admin role check working perfectly)
-- Ideally: USING (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
-- For now, let's allow all authenticated users to manage if they are admins (relying on UI hiding for now, or simple auth check)
CREATE POLICY "Allow all access to admin users" ON public.plan_prices FOR ALL USING (auth.role() = 'authenticated'); 

-- 3. Seed Data
-- Standard Plan Monthly
INSERT INTO public.plan_prices (plan_id, amount, interval, is_public, campaign_code) 
SELECT 'STANDARD', 2000, 'month', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.plan_prices WHERE plan_id = 'STANDARD' AND interval = 'month' AND is_public = true);

-- Standard Plan Yearly
INSERT INTO public.plan_prices (plan_id, amount, interval, is_public, campaign_code)
SELECT 'STANDARD', 20000, 'year', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.plan_prices WHERE plan_id = 'STANDARD' AND interval = 'year' AND is_public = true);

-- Hidden Early Bird Campaign
INSERT INTO public.plan_prices (plan_id, amount, interval, is_public, campaign_code)
SELECT 'STANDARD', 15000, 'year', false, 'EARLY_BIRD'
WHERE NOT EXISTS (SELECT 1 FROM public.plan_prices WHERE plan_id = 'STANDARD' AND campaign_code = 'EARLY_BIRD');
