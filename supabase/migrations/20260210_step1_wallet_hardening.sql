-- STEP 1: SEGURIDAD Y BASE DE DATOS - WALLET HARDENING
-- MI PANA APP v3.0
-- Fecha: 2026-02-10

-- ============================================================================
-- 1. RECHARGE REQUESTS SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.recharge_requests ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver sus propias solicitudes
CREATE POLICY "Users can view their own recharge requests" 
ON public.recharge_requests
FOR SELECT 
USING (auth.uid() = user_id);

-- Política: Usuarios pueden crear sus propias solicitudes
CREATE POLICY "Users can create their own recharge requests" 
ON public.recharge_requests
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política: Nadie puede actualizar solicitudes excepto el sistema (via funciones) o admins
-- (Asumimos que las actualizaciones de estado las hace la Edge Function con Service Role, que hace bypass de RLS)
-- Pero por si acaso, permitimos lectura. Update y Delete bloqueados para usuarios normales.

-- ============================================================================
-- 2. BANK TRANSACTIONS SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios solo ven transacciones emparejadas con ellos
CREATE POLICY "Users can view their matched bank transactions" 
ON public.bank_transactions
FOR SELECT 
USING (auth.uid() = matched_user_id);

-- Política: Nadie inserta/borra/edita bank_transactions directamente (solo sistema)

-- ============================================================================
-- 3. INMUTABILIDAD FINANCIERA (TRIGGERS)
-- ============================================================================

-- Función para bloquear modificaciones en tablas financieras
CREATE OR REPLACE FUNCTION prevent_financial_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        RAISE EXCEPTION 'Security Violation: Eliminar registros financieros está prohibido.';
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Permitir solo actualizaciones de metadatos no financieros si es absolutamente necesario, 
        -- pero para wallet_transactions, NADA debería cambiar.
        RAISE EXCEPTION 'Security Violation: Modificar registros financieros históricos está prohibido.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para Wallet Transactions (Sagrado)
DROP TRIGGER IF EXISTS trg_protect_wallet_transactions ON public.wallet_transactions;
CREATE TRIGGER trg_protect_wallet_transactions
    BEFORE UPDATE OR DELETE ON public.wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_financial_modification();

-- Trigger para Bank Transactions (Sagrado)
DROP TRIGGER IF EXISTS trg_protect_bank_transactions ON public.bank_transactions;
CREATE TRIGGER trg_protect_bank_transactions
    BEFORE UPDATE OR DELETE ON public.bank_transactions
    FOR EACH ROW
    EXECUTE FUNCTION prevent_financial_modification();

-- ============================================================================
-- 4. VERIFICACIÓN DE CONSTRAINTS
-- ============================================================================
-- Asegurar que no existan saldos negativos (redundancia de seguridad)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'wallets_balance_ves_check'
    ) THEN
        ALTER TABLE public.wallets ADD CONSTRAINT wallets_balance_ves_check CHECK (balance_ves >= 0);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'wallets_balance_usd_check'
    ) THEN
        ALTER TABLE public.wallets ADD CONSTRAINT wallets_balance_usd_check CHECK (balance_usd >= 0);
    END IF;
END $$;
