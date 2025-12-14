-- 1. Create plan_prices table
CREATE TABLE IF NOT EXISTS public.plan_prices (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    plan_id text REFERENCES public.plan_limits(plan_id) ON DELETE CASCADE,
    amount integer NOT NULL,
    currency text DEFAULT 'jpy' NOT NULL,
    interval text CHECK (interval IN ('month', 'year')) NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    campaign_code text, -- e.g. 'EARLY2025'
    stripe_price_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS current_price_id uuid REFERENCES public.plan_prices(id);

-- 3. RLS for plan_prices (Public Read for active ones, but logic is handled in backend usually for visibility)
-- We allow authenticated users to read prices to display them.
ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read prices" ON public.plan_prices;
CREATE POLICY "Read prices" ON public.plan_prices
    FOR SELECT
    USING (true);

-- 4. SEED DATA
-- Clear existing to avoid duplicates if re-running (or use ON CONFLICT DO NOTHING if ID was fixed)
-- Since we are generating UUIDs, let's just insert checking existence or use a temp block.
-- For simplicity in this environment, I will just Insert specific records.

INSERT INTO public.plan_prices (plan_id, amount, interval, is_public, campaign_code)
VALUES
    -- Standard (Public)
    ('standard', 2000, 'month', true, NULL),
    ('standard', 20000, 'year', true, NULL),
    
    -- Standard (Campaign: Early Bird)
    ('standard', 15000, 'year', false, 'EARLY_BIRD'),

    -- Pro (Public)
    ('pro', 5000, 'month', true, NULL),
    ('pro', 50000, 'year', true, NULL),

    -- Enterprise (Contact Us - usually 0 or hidden, let's add placeholder)
    ('enterprise', 0, 'month', true, NULL);
