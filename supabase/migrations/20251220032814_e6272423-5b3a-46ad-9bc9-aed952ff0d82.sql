-- Create user_events table for comprehensive analytics tracking
CREATE TABLE public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT, -- For tracking before login
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL, -- 'navigation', 'interaction', 'feature', 'engagement', 'error'
  event_data JSONB DEFAULT '{}',
  page_path TEXT,
  referrer TEXT,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast querying
CREATE INDEX idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX idx_user_events_anonymous_id ON public.user_events(anonymous_id);
CREATE INDEX idx_user_events_created_at ON public.user_events(created_at DESC);
CREATE INDEX idx_user_events_event_name ON public.user_events(event_name);
CREATE INDEX idx_user_events_session_id ON public.user_events(session_id);
CREATE INDEX idx_user_events_category ON public.user_events(event_category);
CREATE INDEX idx_user_events_composite ON public.user_events(user_id, event_name, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Policy for inserting events (any authenticated or anonymous user can insert)
CREATE POLICY "Anyone can insert events"
ON public.user_events
FOR INSERT
WITH CHECK (true);

-- Policy for users to view their own events
CREATE POLICY "Users can view their own events"
ON public.user_events
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Admin policy for viewing all events (you can restrict this to specific roles later)
CREATE POLICY "Admins can view all events"
ON public.user_events
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Enable real-time for live dashboard updates
ALTER TABLE public.user_events REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_events;