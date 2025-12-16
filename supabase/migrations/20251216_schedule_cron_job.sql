-- migration: schedule_subscription_check.sql
-- Schedule the job to run every day at 3:00 AM JST (18:00 UTC)

SELECT cron.schedule(
  'check-subscription-daily',
  '0 18 * * *',               -- UTCで18:00 (＝日本時間の翌朝 3:00)
  $$
    UPDATE organizations
    SET plan_id = 'free', subscription_status = 'expired'
    WHERE current_period_end < now() AND plan_id != 'free';
  $$
);
