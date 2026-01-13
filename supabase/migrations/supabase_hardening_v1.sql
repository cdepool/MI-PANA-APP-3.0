-- MI PANA APP - CONSOLIDATED HARDENING & BACKEND ROBUSTNESS
-- Phase 3.2 Migration

-- 1. SECURITY HARDENING: Extensions & Schema
CREATE SCHEMA IF NOT EXISTS extensions;
-- Move postgis to extensions schema if it exists in public
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    EXECUTE 'ALTER EXTENSION postgis SET SCHEMA extensions';
  END IF;
END $$;

-- 2. SECURITY HARDENING: handle_protected_columns security
CREATE OR REPLACE FUNCTION public.handle_protected_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent modification of critical columns via regular users
    -- search_path is set to empty to avoid lateral attacks
    IF (TG_OP = 'UPDATE') THEN
        IF NEW.id <> OLD.id THEN
            NEW.id = OLD.id;
        END IF;
        IF NEW.created_at <> OLD.created_at THEN
            NEW.created_at = OLD.created_at;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 3. BANCAMIGA INTEGRATION TABLES
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR(50) UNIQUE NOT NULL,
  refpk VARCHAR(100) UNIQUE NOT NULL,
  phone_orig VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  bank_orig VARCHAR(10) NOT NULL,
  transaction_date TIMESTAMP NOT NULL,
  received_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  matched_user_id UUID REFERENCES auth.users(id),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. WALLET SYSTEM TABLES
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate DECIMAL(10,4) NOT NULL CHECK (rate > 0),
  source VARCHAR(50) DEFAULT 'dolarapi.com',
  rate_type VARCHAR(20) DEFAULT 'oficial',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(effective_date, rate_type)
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance_ves DECIMAL(12,2) DEFAULT 0.00 NOT NULL CHECK (balance_ves >= 0),
  balance_usd DECIMAL(12,2) DEFAULT 0.00 NOT NULL CHECK (balance_usd >= 0),
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  amount_ves DECIMAL(12,2) NOT NULL,
  amount_usd DECIMAL(12,2),
  exchange_rate DECIMAL(10,4),
  balance_ves_after DECIMAL(12,2) NOT NULL,
  balance_usd_after DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference VARCHAR(100),
  bank_transaction_id UUID REFERENCES public.bank_transactions(id),
  trip_id UUID REFERENCES public.trips(id), -- Fixed from 'rides' to 'trips'
  status VARCHAR(20) DEFAULT 'completed' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_current_exchange_rate(p_rate_type VARCHAR DEFAULT 'oficial')
RETURNS DECIMAL(10,4) AS $$
DECLARE
  v_rate DECIMAL(10,4);
BEGIN
  SELECT rate INTO v_rate
  FROM public.exchange_rates
  WHERE rate_type = p_rate_type
  ORDER BY effective_date DESC
  LIMIT 1;
  RETURN COALESCE(v_rate, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- 6. RLS POLICIES
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exchange rates are public" ON public.exchange_rates
    FOR SELECT USING (true);

-- 7. NOTIFY UPDATES
COMMENT ON TABLE public.wallets IS 'Billetera principal de cada usuario';
