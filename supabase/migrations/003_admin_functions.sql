-- =============================================================================
-- Admin Functions for System Logs & User Stats
-- =============================================================================
-- Run this in Supabase SQL Editor.
-- These functions use SECURITY DEFINER to bypass RLS and are restricted
-- to the admin user by checking email against 'keithpaul.dev@gmail.com'.
-- =============================================================================

-- 1. Get total user count
CREATE OR REPLACE FUNCTION admin_get_user_count()
RETURNS INTEGER AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid()) != 'keithpaul.dev@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN (SELECT COUNT(*)::INTEGER FROM auth.users);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get recent signups (last 30 days)
CREATE OR REPLACE FUNCTION admin_get_recent_signups(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ
) AS $$
BEGIN
  IF (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()) != 'keithpaul.dev@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT au.id, au.email::TEXT, au.created_at, au.last_sign_in_at, au.confirmed_at
    FROM auth.users au
    WHERE au.created_at >= NOW() - (days_back || ' days')::INTERVAL
    ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get system stats (transactions, categories, projects per user)
CREATE OR REPLACE FUNCTION admin_get_system_stats()
RETURNS TABLE (
  total_users INTEGER,
  total_transactions BIGINT,
  total_categories BIGINT,
  total_projects BIGINT,
  total_budget_goals BIGINT,
  transactions_today BIGINT,
  signups_this_week BIGINT
) AS $$
BEGIN
  IF (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()) != 'keithpaul.dev@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT
      (SELECT COUNT(*)::INTEGER FROM auth.users),
      (SELECT COUNT(*) FROM transactions WHERE is_deleted = false),
      (SELECT COUNT(*) FROM categories WHERE is_default = false),
      (SELECT COUNT(*) FROM projects),
      (SELECT COUNT(*) FROM budget_goals),
      (SELECT COUNT(*) FROM transactions WHERE is_deleted = false AND created_at::DATE = CURRENT_DATE),
      (SELECT COUNT(*) FROM auth.users au2 WHERE au2.created_at >= NOW() - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get recent audit logs (across all users)
CREATE OR REPLACE FUNCTION admin_get_audit_logs(log_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  user_email TEXT,
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
    SELECT al.id, al.user_id, au.email::TEXT AS user_email, al.action, al.entity_type, al.entity_id,
           al.old_values, al.new_values, al.created_at
    FROM audit_logs al
    LEFT JOIN auth.users au ON al.user_id = au.id
    ORDER BY al.created_at DESC
    LIMIT log_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Get per-user activity summary
CREATE OR REPLACE FUNCTION admin_get_user_activity()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  username VARCHAR,
  signup_date TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  transaction_count BIGINT,
  total_income NUMERIC,
  total_expenses NUMERIC
) AS $$
BEGIN
  IF (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()) != 'keithpaul.dev@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT
      au.id,
      au.email::TEXT,
      p.username,
      au.created_at AS signup_date,
      au.last_sign_in_at AS last_login,
      COUNT(t.id) AS transaction_count,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expenses
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    LEFT JOIN transactions t ON au.id = t.user_id AND t.is_deleted = false
    GROUP BY au.id, au.email, p.username, au.created_at, au.last_sign_in_at
    ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
