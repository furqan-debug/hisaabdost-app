-- Create scheduled_notifications table
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  trigger_data JSONB NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_notifications_user ON public.scheduled_notifications(user_id);
CREATE INDEX idx_scheduled_notifications_scheduled ON public.scheduled_notifications(scheduled_for);
CREATE INDEX idx_scheduled_notifications_status ON public.scheduled_notifications(status);

-- Enable RLS
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scheduled notifications"
  ON public.scheduled_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled notifications"
  ON public.scheduled_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled notifications"
  ON public.scheduled_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Add notification_preferences to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "loanReminders": true,
  "loanReminderDays": [7, 3, 1],
  "budgetAlerts": true,
  "budgetThresholds": [50, 60, 70, 80, 90, 100],
  "goalReminders": true,
  "dailySummary": true,
  "dailySummaryTime": "20:00",
  "weeklySummary": true,
  "overspendingAlerts": true,
  "savingsOpportunities": true
}'::jsonb;

-- Setup cron job for hourly notification check
SELECT cron.schedule(
  'send-scheduled-push-notifications',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bklfolfivjonzpprytkz.supabase.co/functions/v1/scheduled-push-notifications',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbGZvbGZpdmpvbnpwcHJ5dGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMjM0NjQsImV4cCI6MjA1NTg5OTQ2NH0.oipdwmQ4lRIyeYX00Irz4q0ZEDlKc9wuQhSPbHRzOKE"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Setup cron job for daily summary at 8 PM
SELECT cron.schedule(
  'daily-financial-summary',
  '0 20 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bklfolfivjonzpprytkz.supabase.co/functions/v1/scheduled-push-notifications',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbGZvbGZpdmpvbnpwcHJ5dGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMjM0NjQsImV4cCI6MjA1NTg5OTQ2NH0.oipdwmQ4lRIyeYX00Irz4q0ZEDlKc9wuQhSPbHRzOKE"}'::jsonb,
    body := '{"type": "daily_summary"}'::jsonb
  ) AS request_id;
  $$
);

-- Setup cron job for weekly summary on Sunday 10 AM
SELECT cron.schedule(
  'weekly-financial-report',
  '0 10 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://bklfolfivjonzpprytkz.supabase.co/functions/v1/scheduled-push-notifications',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbGZvbGZpdmpvbnpwcHJ5dGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMjM0NjQsImV4cCI6MjA1NTg5OTQ2NH0.oipdwmQ4lRIyeYX00Irz4q0ZEDlKc9wuQhSPbHRzOKE"}'::jsonb,
    body := '{"type": "weekly_report"}'::jsonb
  ) AS request_id;
  $$
);