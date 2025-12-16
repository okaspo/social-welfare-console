-- Setup Database Webhook for syncing Organization Name to Stripe

-- 1. Create the Trigger Function
-- This function wraps the http request to the Edge Function
-- Note: In managed Supabase, specifically for database webhooks, 
-- it is often easier to configure via UI. However, using pg_net or an HTTP extension:

CREATE OR REPLACE FUNCTION public.trigger_sync_org_profile()
RETURNS TRIGGER AS $$
DECLARE
  -- Replace with your actual project URL and Anon/Service Key
  -- Ideally these are stored in vault or secrets, but for migration file usage:
  edge_function_url text := 'https://PROJECT_ID.supabase.co/functions/v1/sync-org-profile';
  service_key text := 'YOUR_SERVICE_ROLE_KEY'; -- Placeholder: User must replace or use vault
BEGIN
  -- Only trigger if name changed
  IF NEW.name <> OLD.name THEN
    -- Using pg_net extension to make async request
    -- Check if pg_net is available, otherwise raise notice
    
    -- Construct Payload
    -- We can just send the row data, or standard webhook format
    PERFORM net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'organizations',
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD),
        'schema', 'public'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS on_org_name_change ON public.organizations;

CREATE TRIGGER on_org_name_change
  AFTER UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_org_profile();

-- Note: user needs to enable pg_net extension
CREATE EXTENSION IF NOT EXISTS "pg_net";
