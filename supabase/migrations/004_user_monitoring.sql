-- =============================================================================
-- User Monitoring Tables & Admin Functions
-- =============================================================================
-- Run this in Supabase SQL Editor.
-- Creates tables for storing per-user performance metrics and auth events,
-- plus admin functions to query them.
-- =============================================================================

-- 1. User Performance Logs — stores client-side performance snapshots
CREATE TABLE IF NOT EXISTS user_performance_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_load_time NUMERIC,
  dom_content_loaded NUMERIC,
  first_contentful_paint NUMERIC,
  largest_contentful_paint NUMERIC,
  time_to_interactive NUMERIC,
  api_latency NUMERIC,
  connection_type TEXT,
  effective_type TEXT,
  downlink NUMERIC,
  rtt NUMERIC,
  device_memory NUMERIC,
  hardware_concurrency INTEGER,
  is_mobile BOOLEAN DEFAULT false,
  screen_size TEXT,
  user_agent TEXT,
  total_resources INTEGER,
  total_transfer_size NUMERIC,
  js_size NUMERIC,
  css_size NUMERIC,
  image_size NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast admin queries by user
CREATE INDEX IF NOT EXISTS idx_perf_logs_user_id ON user_performance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_perf_logs_created_at ON user_performance_logs(created_at DESC);

-- RLS: users can only insert their own performance data
ALTER TABLE user_performance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own performance logs"
  ON user_performance_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own performance logs"
  ON user_performance_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 2. User Auth Events — tracks password resets, changes, logins
CREATE TABLE IF NOT EXISTS user_auth_events (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'password_reset', 'password_change', 'login', 'logout', 'signup'
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON user_auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON user_auth_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_type ON user_auth_events(event_type);

-- RLS: users can only insert their own auth events
ALTER TABLE user_auth_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own auth events"
  ON user_auth_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own auth events"
  ON user_auth_events FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- Admin Functions (SECURITY DEFINER — bypasses RLS, restricted to admin)
-- =============================================================================

-- 3. Get performance logs for a specific user
CREATE OR REPLACE FUNCTION admin_get_user_performance(target_user_id UUID, log_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id INTEGER,
  page_url TEXT,
  page_load_time NUMERIC,
  dom_content_loaded NUMERIC,
  first_contentful_paint NUMERIC,
  largest_contentful_paint NUMERIC,
  time_to_interactive NUMERIC,
  api_latency NUMERIC,
  connection_type TEXT,
  effective_type TEXT,
  downlink NUMERIC,
  rtt NUMERIC,
  device_memory NUMERIC,
  hardware_concurrency INTEGER,
  is_mobile BOOLEAN,
  screen_size TEXT,
  user_agent TEXT,
  total_resources INTEGER,
  total_transfer_size NUMERIC,
  js_size NUMERIC,
  css_size NUMERIC,
  image_size NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()) != 'keithpaul.dev@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT p.id, p.page_url, p.page_load_time, p.dom_content_loaded,
           p.first_contentful_paint, p.largest_contentful_paint,
           p.time_to_interactive, p.api_latency,
           p.connection_type, p.effective_type, p.downlink, p.rtt,
           p.device_memory, p.hardware_concurrency, p.is_mobile,
           p.screen_size, p.user_agent, p.total_resources,
           p.total_transfer_size, p.js_size, p.css_size, p.image_size,
           p.created_at
    FROM user_performance_logs p
    WHERE p.user_id = target_user_id
    ORDER BY p.created_at DESC
    LIMIT log_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get auth events for a specific user
CREATE OR REPLACE FUNCTION admin_get_user_auth_events(target_user_id UUID, log_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id INTEGER,
  event_type VARCHAR,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()) != 'keithpaul.dev@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT e.id, e.event_type, e.ip_address, e.user_agent, e.metadata, e.created_at
    FROM user_auth_events e
    WHERE e.user_id = target_user_id
    ORDER BY e.created_at DESC
    LIMIT log_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Get audit logs for a specific user
CREATE OR REPLACE FUNCTION admin_get_user_audit_logs(target_user_id UUID, log_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id INTEGER,
  action VARCHAR,
  entity_type VARCHAR,
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()) != 'keithpaul.dev@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT al.id, al.action, al.entity_type, al.entity_id,
           al.old_values, al.new_values, al.created_at
    FROM audit_logs al
    WHERE al.user_id = target_user_id
    ORDER BY al.created_at DESC
    LIMIT log_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Get performance summary across all users (for admin overview)
CREATE OR REPLACE FUNCTION admin_get_performance_summary()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  total_snapshots BIGINT,
  avg_page_load NUMERIC,
  avg_fcp NUMERIC,
  avg_lcp NUMERIC,
  avg_api_latency NUMERIC,
  latest_snapshot TIMESTAMPTZ,
  primary_device TEXT
) AS $$
BEGIN
  IF (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()) != 'keithpaul.dev@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT
      p.user_id,
      au.email::TEXT,
      COUNT(*)::BIGINT AS total_snapshots,
      ROUND(AVG(p.page_load_time), 0) AS avg_page_load,
      ROUND(AVG(p.first_contentful_paint), 0) AS avg_fcp,
      ROUND(AVG(p.largest_contentful_paint), 0) AS avg_lcp,
      ROUND(AVG(p.api_latency), 0) AS avg_api_latency,
      MAX(p.created_at) AS latest_snapshot,
      CASE WHEN BOOL_OR(p.is_mobile) AND NOT BOOL_AND(p.is_mobile) THEN 'Both'
           WHEN BOOL_OR(p.is_mobile) THEN 'Mobile'
           ELSE 'Desktop'
      END AS primary_device
    FROM user_performance_logs p
    JOIN auth.users au ON p.user_id = au.id
    GROUP BY p.user_id, au.email
    ORDER BY avg_page_load DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
