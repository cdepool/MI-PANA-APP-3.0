-- ============================================================================
-- VALIDATION QUERIES - STEP 1 SECURITY AUDIT
-- Ejecutar en SQL Editor de Supabase para verificar
-- ============================================================================

-- 1. VERIFICAR RLS EN RECHARGE REQUESTS
-- Resultado esperado: true, true
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('recharge_requests', 'bank_transactions');

-- 2. SIMULAR ACCESO ANÓNIMO (Debe fallar o retornar vacío)
-- Cambiar rol a anon
SET ROLE anon;
SELECT count(*) FROM recharge_requests; -- Esperado: 0 o Error Permiso

-- 3. SIMULAR VIOLACIÓN DE INMUTABILIDAD
-- Intentar actualizar una transacción (Debe fallar por Trigger)
-- Primero volvemos a postgres
SET ROLE postgres;
-- Insertamos data dummy si no existe para probar
INSERT INTO wallet_transactions (id, wallet_id, user_id, type, amount_ves, balance_ves_after, balance_usd_after)
VALUES ('00000000-0000-0000-0000-000000000001', (SELECT id FROM wallets LIMIT 1), (SELECT user_id FROM wallets LIMIT 1), 'test', 100, 100, 0)
ON CONFLICT DO NOTHING;

-- Intentar Update
BEGIN;
UPDATE wallet_transactions SET amount_ves = 99999 WHERE id = '00000000-0000-0000-0000-000000000001';
-- Esperado: ERROR: Security Violation: Modificar registros financieros históricos está prohibido.
ROLLBACK;

-- 4. VERIFICAR AISLAMIENTO DE USUARIO
-- Crear usuario A y B (simulado con auth.uid())
-- Esto es más complejo de simular solo en SQL sin crear usuarios reales en auth.users, 
-- pero visualmente podemos ver las policies:
SELECT * FROM pg_policies WHERE tablename IN ('recharge_requests', 'bank_transactions');
