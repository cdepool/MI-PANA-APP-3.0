-- PUSH NOTIFICATIONS - Database Schema Enhancement
-- MI PANA APP v3.0 - Sprint 2
-- Add FCM token column to profiles table

-- Add FCM token column for push notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token 
  ON profiles(fcm_token) 
  WHERE fcm_token IS NOT NULL;

-- Notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB 
  DEFAULT '{"trip_updates": true, "promotions": false, "driver_nearby": true}'::jsonb;

COMMENT ON COLUMN profiles.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
COMMENT ON COLUMN profiles.notification_preferences IS 'User notification preferences';

-- ============================================================================
-- TABLE: notification_logs
-- Audit trail for all sent notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification details
  type VARCHAR(50) NOT NULL, -- trip_request, trip_accepted, payment_confirmed, etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  
  -- Delivery status
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
  fcm_message_id TEXT, -- Firebase response ID
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- RLS for notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notification_logs' AND policyname = 'Users read own notifications'
  ) THEN
    CREATE POLICY "Users read own notifications"
      ON notification_logs
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON TABLE notification_logs IS 'Audit trail for all push notifications sent';
