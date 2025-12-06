-- BANCAMIGA Integration - Database Schema
-- MI PANA APP v3.0

-- Tabla para almacenar transacciones bancarias recibidas
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Datos del pago
  reference VARCHAR(50) UNIQUE NOT NULL,
  refpk VARCHAR(100) UNIQUE NOT NULL,
  phone_orig VARCHAR(20) NOT NULL,
  phone_dest VARCHAR(20),
  amount DECIMAL(10,2) NOT NULL,
  bank_orig VARCHAR(10) NOT NULL,
  
  -- Fechas
  transaction_date TIMESTAMP NOT NULL,
  received_at TIMESTAMP DEFAULT NOW(),
  
  -- Estado y conciliación
  status VARCHAR(20) DEFAULT 'pending', -- pending, matched, verified, discrepancy
  matched_wallet_transaction_id UUID REFERENCES transactions(id),
  matched_user_id UUID REFERENCES profiles(id),
  
  -- Datos completos del banco (JSON)
  raw_data JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_bank_transactions_reference ON bank_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_refpk ON bank_transactions(refpk);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_phone_orig ON bank_transactions(phone_orig);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON bank_transactions(status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_amount ON bank_transactions(amount);

-- Índice compuesto para búsquedas por teléfono y fecha
CREATE INDEX IF NOT EXISTS idx_bank_transactions_phone_date 
  ON bank_transactions(phone_orig, transaction_date);

-- Tabla para logs de conciliación
CREATE TABLE IF NOT EXISTS reconciliation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Información de la ejecución
  run_date TIMESTAMP DEFAULT NOW(),
  run_type VARCHAR(20), -- manual, automatic, scheduled
  
  -- Resultados
  total_bank_transactions INT,
  matched_count INT,
  pending_count INT,
  discrepancy_count INT,
  
  -- Detalles (JSON)
  details JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_reconciliation_logs_date ON reconciliation_logs(run_date);

-- Tabla para credenciales de BANCAMIGA (solo 1 registro)
CREATE TABLE IF NOT EXISTS bancamiga_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Credenciales
  dni VARCHAR(20) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires BIGINT NOT NULL,
  
  -- Metadata
  last_refreshed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para bank_transactions
CREATE TRIGGER update_bank_transactions_updated_at 
  BEFORE UPDATE ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para bancamiga_credentials
CREATE TRIGGER update_bancamiga_credentials_updated_at 
  BEFORE UPDATE ON bancamiga_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE bank_transactions IS 'Almacena todas las transacciones de pago móvil recibidas de BANCAMIGA';
COMMENT ON TABLE reconciliation_logs IS 'Registra cada ejecución del proceso de conciliación bancaria';
COMMENT ON TABLE bancamiga_credentials IS 'Almacena las credenciales de acceso a la API de BANCAMIGA';

COMMENT ON COLUMN bank_transactions.status IS 'pending: recibido, matched: conciliado con transacción, verified: verificado por admin, discrepancy: discrepancia detectada';
COMMENT ON COLUMN bank_transactions.refpk IS 'Referencia primaria única de BANCAMIGA (formato: YYYYMMDD + BankCode + Phone + Reference)';
COMMENT ON COLUMN bank_transactions.raw_data IS 'Datos completos del pago tal como los envía BANCAMIGA';
