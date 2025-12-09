-- 1. Update organizations table with B2B fields
ALTER TABLE public.organizations
ADD COLUMN address TEXT,
ADD COLUMN establishment_date DATE,
ADD COLUMN phone TEXT;

-- 2. Update the handle_new_user function to create an Organization and link Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new Organization for the user
  INSERT INTO public.organizations (name, address, establishment_date, phone, plan)
  VALUES (
    new.raw_user_meta_data->>'corporation_name',
    new.raw_user_meta_data->>'corporation_address',
    (new.raw_user_meta_data->>'establishment_date')::DATE,
    new.raw_user_meta_data->>'corporation_phone',
    'FREE' -- Default plan
  )
  RETURNING id INTO new_org_id;

  -- Create the Profile linked to the new Organization
  INSERT INTO public.profiles (id, full_name, corporation_name, organization_id, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name', -- Keeping strictly as "Representative Name" / "Account Holder"
    new.raw_user_meta_data->>'corporation_name',
    new_org_id,
    'admin' -- First user is always admin of their org
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
