-- WALLET SYSTEM - Database Schema
-- MI PANA APP v3.0
-- Sistema de billetera dual VES/USD con recarga vía Pago Móvil

-- ============================================================================
-- TABLA: wallets
-- Billetera principal de cada usuario
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Saldos en ambas monedas
  balance_ves DECIMAL(12,2) DEFAULT 0.00 NOT NULL CHECK (balance_ves >= 0),
  balance_usd DECIMAL(12,2) DEFAULT 0.00 NOT NULL CHECK (balance_usd >= 0),
  
  -- Estado de la billetera
  status VARCHAR(20) DEFAULT 'active' NOT NULL, -- active, suspended, blocked
  
  -- Límites (opcional, para control)
  daily_limit_ves DECIMAL(12,2),
  monthly_limit_ves DECIMAL(12,2),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Un usuario solo puede tener una billetera
  UNIQUE(user_id)
);

-- Índices para wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);

-- ============================================================================
-- TABLA: wallet_transactions
-- Historial de todas las transacciones de la billetera
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Tipo de transacción
  type VARCHAR(30) NOT NULL, -- recharge, payment, refund, withdrawal, adjustment
  
  -- Montos
  amount_ves DECIMAL(12,2) NOT NULL,
  amount_usd DECIMAL(12,2),
  
  -- Tasa de cambio aplicada (si aplica)
  exchange_rate DECIMAL(10,4),
  
  -- Saldos después de la transacción
  balance_ves_after DECIMAL(12,2) NOT NULL,
  balance_usd_after DECIMAL(12,2) NOT NULL,
  
  -- Descripción y referencia
  description TEXT,
  reference VARCHAR(100), -- Referencia externa (ej: ID de viaje, referencia bancaria)
  
  -- Relación con otras tablas
  bank_transaction_id UUID REFERENCES bank_transactions(id),
  ride_id UUID REFERENCES rides(id),
  
  -- Estado
  status VARCHAR(20) DEFAULT 'completed' NOT NULL, -- pending, completed, failed, reversed
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_bank_transaction_id ON wallet_transactions(bank_transaction_id);

-- Índice compuesto para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_date 
  ON wallet_transactions(user_id, created_at DESC);

-- ============================================================================
-- TABLA: recharge_requests
-- Solicitudes de recarga pendientes de verificación
-- ============================================================================
CREATE TABLE IF NOT EXISTS recharge_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Datos de la recarga
  amount_ves DECIMAL(12,2) NOT NULL CHECK (amount_ves > 0),
  bank_orig VARCHAR(10) NOT NULL,
  last_four_digits VARCHAR(4) NOT NULL,
  
  -- Estado de verificación
  status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, verified, failed, expired
  
  -- Relación con transacción bancaria (cuando se verifica)
  bank_transaction_id UUID REFERENCES bank_transactions(id),
  wallet_transaction_id UUID REFERENCES wallet_transactions(id),
  
  -- Fechas
  expires_at TIMESTAMP NOT NULL, -- 24 horas desde creación
  verified_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para recharge_requests
CREATE INDEX IF NOT EXISTS idx_recharge_requests_wallet_id ON recharge_requests(wallet_id);
CREATE INDEX IF NOT EXISTS idx_recharge_requests_user_id ON recharge_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_recharge_requests_status ON recharge_requests(status);
CREATE INDEX IF NOT EXISTS idx_recharge_requests_created_at ON recharge_requests(created_at DESC);

-- ============================================================================
-- TABLA: exchange_rates
-- Historial de tasas de cambio VES/USD
-- ============================================================================
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tasa de cambio
  rate DECIMAL(10,4) NOT NULL CHECK (rate > 0),
  
  -- Fuente de la tasa
  source VARCHAR(50) DEFAULT 'dolarapi.com',
  
  -- Tipo de tasa
  rate_type VARCHAR(20) DEFAULT 'oficial', -- oficial, paralelo, promedio
  
  -- Metadata
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Una tasa por día y tipo
  UNIQUE(effective_date, rate_type)
);

-- Índices para exchange_rates
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_type ON exchange_rates(rate_type);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_wallets_updated_at 
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at 
  BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recharge_requests_updated_at 
  BEFORE UPDATE ON recharge_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCIÓN: process_recharge
-- Procesa una recarga verificada y actualiza el saldo
-- ============================================================================
CREATE OR REPLACE FUNCTION process_recharge(
  p_recharge_request_id UUID,
  p_bank_transaction_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_recharge recharge_requests%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_transaction_id UUID;
  v_new_balance_ves DECIMAL(12,2);
BEGIN
  -- Obtener solicitud de recarga
  SELECT * INTO v_recharge FROM recharge_requests WHERE id = p_recharge_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recharge request not found';
  END IF;
  
  IF v_recharge.status != 'pending' THEN
    RAISE EXCEPTION 'Recharge request already processed';
  END IF;
  
  -- Obtener billetera
  SELECT * INTO v_wallet FROM wallets WHERE id = v_recharge.wallet_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  -- Calcular nuevo saldo
  v_new_balance_ves := v_wallet.balance_ves + v_recharge.amount_ves;
  
  -- Crear transacción de billetera
  INSERT INTO wallet_transactions (
    wallet_id,
    user_id,
    type,
    amount_ves,
    balance_ves_after,
    balance_usd_after,
    description,
    bank_transaction_id,
    status
  ) VALUES (
    v_wallet.id,
    v_recharge.user_id,
    'recharge',
    v_recharge.amount_ves,
    v_new_balance_ves,
    v_wallet.balance_usd,
    'Recarga de saldo vía Pago Móvil',
    p_bank_transaction_id,
    'completed'
  ) RETURNING id INTO v_transaction_id;
  
  -- Actualizar saldo de billetera
  UPDATE wallets 
  SET balance_ves = v_new_balance_ves
  WHERE id = v_wallet.id;
  
  -- Actualizar solicitud de recarga
  UPDATE recharge_requests
  SET 
    status = 'verified',
    bank_transaction_id = p_bank_transaction_id,
    wallet_transaction_id = v_transaction_id,
    verified_at = NOW()
  WHERE id = p_recharge_request_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: get_current_exchange_rate
-- Obtiene la tasa de cambio actual
-- ============================================================================
CREATE OR REPLACE FUNCTION get_current_exchange_rate(p_rate_type VARCHAR DEFAULT 'oficial')
RETURNS DECIMAL(10,4) AS $$
DECLARE
  v_rate DECIMAL(10,4);
BEGIN
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE rate_type = p_rate_type
  ORDER BY effective_date DESC
  LIMIT 1;
  
  RETURN COALESCE(v_rate, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: convert_ves_to_usd
-- Convierte VES a USD usando la tasa actual
-- ============================================================================
CREATE OR REPLACE FUNCTION convert_ves_to_usd(p_amount_ves DECIMAL)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  v_rate DECIMAL(10,4);
BEGIN
  v_rate := get_current_exchange_rate();
  
  IF v_rate = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(p_amount_ves / v_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: convert_usd_to_ves
-- Convierte USD a VES usando la tasa actual
-- ============================================================================
CREATE OR REPLACE FUNCTION convert_usd_to_ves(p_amount_usd DECIMAL)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  v_rate DECIMAL(10,4);
BEGIN
  v_rate := get_current_exchange_rate();
  RETURN ROUND(p_amount_usd * v_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================================================
COMMENT ON TABLE wallets IS 'Billetera principal de cada usuario con saldo en VES y USD';
COMMENT ON TABLE wallet_transactions IS 'Historial completo de transacciones de la billetera';
COMMENT ON TABLE recharge_requests IS 'Solicitudes de recarga pendientes de verificación vía Pago Móvil';
COMMENT ON TABLE exchange_rates IS 'Historial de tasas de cambio VES/USD';

COMMENT ON COLUMN wallets.balance_ves IS 'Saldo disponible en Bolívares';
COMMENT ON COLUMN wallets.balance_usd IS 'Saldo disponible en Dólares';
COMMENT ON COLUMN wallet_transactions.type IS 'recharge: recarga, payment: pago de viaje, refund: reembolso, withdrawal: retiro, adjustment: ajuste manual';
COMMENT ON COLUMN recharge_requests.expires_at IS 'Solicitud expira 24 horas después de creación';
