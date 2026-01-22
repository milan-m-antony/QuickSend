-- QuickSend Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the signaling database.

-- 1. Create the sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  offer jsonb,
  answer jsonb,
  sender_ice jsonb DEFAULT '[]'::jsonb,
  receiver_ice jsonb DEFAULT '[]'::jsonb
);

-- 2. Index for high-performance lookups by connection code
CREATE INDEX IF NOT EXISTS sessions_code_idx ON sessions (code);

-- 3. Enable Realtime for the sessions table
-- This allows peers to detect offers/answers/ICE candidates instantly.
BEGIN;
  -- Remove if already exists to avoid errors on reapplying
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE sessions;
COMMIT;

-- 4. Set up Row Level Security (RLS)
-- For public P2P without authentication, we allow anonymous access.
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for P2P'
    ) THEN
        CREATE POLICY "Public Access for P2P" 
        ON sessions FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- 5. Automated Janitor: Global Cleanup Function
-- Removes sessions older than 2 minutes to keep the database within free-tier limits.
-- Note: The extension also performs "Distributed Cleanup" on every connection.
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE created_at < now() - interval '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- 6. Optional: Enable pg_cron for automatic cleanup every minute
-- Note: This requires the 'pg_cron' extension to be enabled in your Supabase project.
-- SELECT cron.schedule('*/1 * * * *', 'SELECT cleanup_old_sessions()');
