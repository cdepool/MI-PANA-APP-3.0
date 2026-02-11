-- VALIDATION QUERIES - STEP 7.1 (POST-LAUNCH MONITORING)
-- Ejecutar en Supabase SQL Editor para verificar salud del sistema en vivo.

-- 1. Ver las últimas 5 transacciones de hoy
SELECT 
    t.created_at,
    t.type,
    t.amount_usd,
    t.amount_ves,
    t.rate,
    t.status,
    u.email as user_email
FROM transactions t
JOIN auth.users u ON t.wallet_id = (SELECT id FROM wallets WHERE user_id = u.id)
ORDER BY t.created_at DESC
LIMIT 5;

-- 2. Verificar Tasa de Cambio actual en BD vs. Transacciones recientes
SELECT 
    rate as "Tasa Oficial Hoy (BD)",
    source,
    updated_at
FROM exchange_rates 
WHERE effective_date = CURRENT_DATE;

-- 3. Auditoría de Saldos Negativos (Alerta Roja)
SELECT * FROM wallets WHERE balance_usd < 0;

-- 4. Totales del Sistema (Conciliación básica)
SELECT 
    COUNT(*) as total_wallets,
    SUM(balance_usd) as total_liability_usd
FROM wallets;
