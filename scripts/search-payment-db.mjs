#!/usr/bin/env node

/**
 * Script para buscar un pago en la base de datos de Supabase
 * Uso: node scripts/search-payment-db.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mdaksestqxfdxpirudsc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWtzZXN0cXhmZHhwaXJ1ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4OTc5MjcsImV4cCI6MjA0ODQ3MzkyN30.yC0HyP0ETAH1Gfrc3PD55VLFOfZc4Pd_pZGLpHrQtgc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function searchPaymentInDatabase() {
    console.log('🔍 Buscando pago en la base de datos...');
    console.log('📋 Criterios de búsqueda:');
    console.log('   Referencia termina en: 0120');
    console.log('   Monto: 122.00');
    console.log('   Banco origen: 0102 (Banco de Venezuela)\n');

    try {
        // Buscar en bank_transactions
        const { data, error } = await supabase
            .from('bank_transactions')
            .select('*')
            .like('reference', '%0120')
            .eq('amount', 122.00)
            .order('transaction_date', { ascending: false })
            .limit(10);

        if (error) {
            console.error('❌ Error al consultar la base de datos:', error);
            return;
        }

        if (!data || data.length === 0) {
            console.log('❌ No se encontró ningún pago que coincida con los criterios.\n');
            console.log('💡 Esto puede significar que:');
            console.log('   1. El pago aún no ha sido sincronizado desde Bancamiga');
            console.log('   2. Los datos de la referencia o monto no coinciden exactamente');
            console.log('   3. El pago es muy antiguo (más de 7 días)');
            return;
        }

        console.log(`✅ Encontrados ${data.length} pago(s):\n`);

        data.forEach((payment, index) => {
            console.log(`━━━ Pago ${index + 1} ━━━`);
            console.log(`Referencia: ${payment.reference}`);
            console.log(`RefPK: ${payment.refpk}`);
            console.log(`Monto: Bs. ${payment.amount}`);
            console.log(`Banco origen: ${payment.bank_orig}`);
            console.log(`Teléfono origen: ${payment.phone_orig}`);
            console.log(`Teléfono destino: ${payment.phone_dest}`);
            console.log(`Fecha transacción: ${payment.transaction_date}`);
            console.log(`Estado: ${payment.status}`);
            console.log(`Usuario asociado: ${payment.matched_user_id || 'N/A'}`);
            console.log(`ID transacción billetera: ${payment.matched_wallet_transaction_id || 'N/A'}\n`);
        });

        // Filtrar por banco si hay múltiples resultados
        const fromBdV = data.filter(p => p.bank_orig === '0102');
        if (fromBdV.length > 0 && fromBdV.length < data.length) {
            console.log(`\n🏦 ${fromBdV.length} de estos pago(s) provienen del Banco de Venezuela (0102)`);
        }

    } catch (err) {
        console.error('\n❌ Error inesperado:', err.message);
    }
}

searchPaymentInDatabase();
