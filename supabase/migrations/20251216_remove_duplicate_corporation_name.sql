-- Remove duplicate data source: corporation_name in profiles
-- The single source of truth should be organizations.name

-- 1. Update handle_new_user function to stop inserting corporation_name into profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new Organization for the user
  INSERT INTO public.organizations (name, address, establishment_date, phone, plan_id)
  VALUES (
    new.raw_user_meta_data->>'corporation_name',
    new.raw_user_meta_data->>'corporation_address',
    (new.raw_user_meta_data->>'establishment_date')::DATE,
    new.raw_user_meta_data->>'corporation_phone',
    'free' -- Default plan
  )
  RETURNING id INTO new_org_id;

  -- Create the Profile linked to the new Organization
  -- Removed corporation_name from INSERT
  INSERT INTO public.profiles (id, full_name, organization_id, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new_org_id,
    'admin' -- First user is always admin of their org
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the column if it exists (Optional: Back up first if needed, but here we just drop as requested)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS corporation_name;
