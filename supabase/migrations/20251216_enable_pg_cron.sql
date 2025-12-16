-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Grant usage to postgres role (standard setup for Supabase)
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Note: In Supabase, pg_cron is usually enabled by default or requires dashboard toggle in some tiers,
-- but this migration ensures it's attempted.
