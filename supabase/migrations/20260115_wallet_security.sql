-- WALLET SECURITY HARDENING - Database Schema Enhancement
-- MI PANA APP v3.0 - Sprint 2
-- Non-destructive additions for security and audit improvements

-- ============================================================================
-- WEBHOOK LOGS TABLE
-- Audit trail for all incoming webhooks (security and debugging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Request details
  endpoint VARCHAR(100) NOT NULL, -- bancamiga, stripe, etc.
  method VARCHAR(10) NOT NULL,
  headers JSONB,
  body JSONB,
  ip_address INET,
  
  -- Validation
  signature_valid BOOLEAN,
  signature_received TEXT,
  signature_expected TEXT,
  
  -- Processing result
  status VARCHAR(20) DEFAULT 'received', -- received, processed, failed, invalid
  response_code INTEGER,
  error_message TEXT,
  processing_time_ms INTEGER,
  
  -- Timestamps
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_endpoint ON webhook_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_received_at ON webhook_logs(received_at DESC);

COMMENT ON TABLE webhook_logs IS 'Audit trail for all incoming webhook requests';

-- ============================================================================
-- IDEMPOTENCY KEYS TABLE
-- Prevent duplicate webhook processing
-- ============================================================================
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_value VARCHAR(255) UNIQUE NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  
  -- Result caching
  status VARCHAR(20) DEFAULT 'processing', -- processing, completed, failed
  response JSONB,
  
  -- Expiration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key_value);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON idempotency_keys(expires_at);

-- Auto-cleanup expired keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE idempotency_keys IS 'Prevents duplicate webhook processing via idempotency keys';

-- ============================================================================
-- ENHANCE bank_transactions TABLE
-- Add security and reconciliation columns
-- ============================================================================
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS 
  signature_verified BOOLEAN DEFAULT false;

ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS 
  reconciliation_status VARCHAR(20) DEFAULT 'pending';
  -- pending, matched, unmatched, manual_review

ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS 
  reconciliation_notes TEXT;

ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS 
  reconciled_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS 
  reconciled_by UUID REFERENCES profiles(id);

COMMENT ON COLUMN bank_transactions.signature_verified IS 'Whether webhook signature was validated';
COMMENT ON COLUMN bank_transactions.reconciliation_status IS 'Status of reconciliation with recharge requests';

-- ============================================================================
-- FUNCTION: check_idempotency
-- Check if a request was already processed
-- ============================================================================
CREATE OR REPLACE FUNCTION check_idempotency(
  p_key VARCHAR(255),
  p_endpoint VARCHAR(100)
)
RETURNS TABLE(
  already_processed BOOLEAN,
  cached_response JSONB,
  idempotency_id UUID
) AS $$
DECLARE
  v_record idempotency_keys%ROWTYPE;
BEGIN
  -- Try to get existing record
  SELECT * INTO v_record 
  FROM idempotency_keys 
  WHERE key_value = p_key 
    AND endpoint = p_endpoint
    AND expires_at > NOW();
  
  IF FOUND THEN
    -- Already processed
    RETURN QUERY SELECT 
      true,
      v_record.response,
      v_record.id;
  ELSE
    -- Create new idempotency record
    INSERT INTO idempotency_keys (key_value, endpoint)
    VALUES (p_key, p_endpoint)
    ON CONFLICT (key_value) DO UPDATE 
      SET expires_at = NOW() + INTERVAL '24 hours'
    RETURNING id INTO v_record.id;
    
    RETURN QUERY SELECT 
      false,
      NULL::JSONB,
      v_record.id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: complete_idempotency
-- Mark an idempotency key as completed with response
-- ============================================================================
CREATE OR REPLACE FUNCTION complete_idempotency(
  p_idempotency_id UUID,
  p_status VARCHAR(20),
  p_response JSONB
)
RETURNS void AS $$
BEGIN
  UPDATE idempotency_keys
  SET 
    status = p_status,
    response = p_response
  WHERE id = p_idempotency_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS FOR NEW TABLES
-- ============================================================================
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'webhook_logs' AND policyname = 'Service role only'
  ) THEN
    CREATE POLICY "Service role only"
      ON webhook_logs
      FOR ALL
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_idempotency TO authenticated;
GRANT EXECUTE ON FUNCTION complete_idempotency TO authenticated;
