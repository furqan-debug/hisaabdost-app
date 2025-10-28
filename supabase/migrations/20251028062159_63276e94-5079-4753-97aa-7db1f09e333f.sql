-- Clean up duplicate and redundant cron jobs
-- Keep only the essential 3 jobs

-- Remove obsolete daily-notification-trigger (uses old function)
SELECT cron.unschedule('daily-notification-trigger');

-- Remove conflicting daily-smart-notifications
SELECT cron.unschedule('daily-smart-notifications');

-- Remove one of the duplicate send-scheduled-push-notifications jobs (keeping the hourly one)
-- Note: We'll verify which job IDs to keep by checking the schedule
-- The hourly job (every hour) is the correct one to keep
-- Daily summary and weekly report jobs are also needed

-- List all jobs first to identify exact job IDs
SELECT * FROM cron.job;

-- Unschedule by job name (Supabase cron uses job names)
-- If there are duplicates with same name, they'll both be removed and we'll recreate the correct ones

-- Remove all existing scheduled notification jobs to start fresh
DO $$ 
DECLARE
  job_record RECORD;
BEGIN
  FOR job_record IN 
    SELECT jobname FROM cron.job 
    WHERE jobname IN (
      'daily-notification-trigger',
      'daily-smart-notifications', 
      'send-scheduled-push-notifications',
      'daily-financial-summary',
      'weekly-financial-report'
    )
  LOOP
    PERFORM cron.unschedule(job_record.jobname);
  END LOOP;
END $$;

-- Recreate only the essential 3 jobs with correct configuration

-- 1. Hourly check for loan reminders & budget alerts
SELECT cron.schedule(
  'send-scheduled-push-notifications',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url:='https://bklfolfivjonzpprytkz.supabase.co/functions/v1/scheduled-push-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbGZvbGZpdmpvbnpwcHJ5dGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMjM0NjQsImV4cCI6MjA1NTg5OTQ2NH0.oipdwmQ4lRIyeYX00Irz4q0ZEDlKc9wuQhSPbHRzOKE"}'::jsonb,
    body:='{"type": "reminders"}'::jsonb
  ) as request_id;
  $$
);

-- 2. Daily financial summary at 8 PM (20:00)
SELECT cron.schedule(
  'daily-financial-summary',
  '0 20 * * *', -- Every day at 8 PM
  $$
  SELECT net.http_post(
    url:='https://bklfolfivjonzpprytkz.supabase.co/functions/v1/scheduled-push-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbGZvbGZpdmpvbnpwcHJ5dGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMjM0NjQsImV4cCI6MjA1NTg5OTQ2NH0.oipdwmQ4lRIyeYX00Irz4q0ZEDlKc9wuQhSPbHRzOKE"}'::jsonb,
    body:='{"type": "daily_summary"}'::jsonb
  ) as request_id;
  $$
);

-- 3. Weekly financial report on Sundays at 10 AM
SELECT cron.schedule(
  'weekly-financial-report',
  '0 10 * * 0', -- Every Sunday at 10 AM
  $$
  SELECT net.http_post(
    url:='https://bklfolfivjonzpprytkz.supabase.co/functions/v1/scheduled-push-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbGZvbGZpdmpvbnpwcHJ5dGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMjM0NjQsImV4cCI6MjA1NTg5OTQ2NH0.oipdwmQ4lRIyeYX00Irz4q0ZEDlKc9wuQhSPbHRzOKE"}'::jsonb,
    body:='{"type": "weekly_report"}'::jsonb
  ) as request_id;
  $$
);