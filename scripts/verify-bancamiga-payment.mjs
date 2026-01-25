#!/usr/bin/env node

/**
 * Script para verificar un pago en Bancamiga
 * Uso: node scripts/verify-bancamiga-payment.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mdaksestqxfdxpirudsc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWtzZXN0cXhmZHhwaXJ1ZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4OTc5MjcsImV4cCI6MjA0ODQ3MzkyN30.yC0HyP0ETAH1Gfrc3PD55VLFOfZc4Pd_pZGLpHrQtgc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyPayment() {
    console.log('🔍 Verificando pago en Bancamiga...');
    console.log('📋 Datos del pago:');
    console.log('   Banco: Banco de Venezuela (0102)');
    console.log('   Últimos 4 dígitos: 0120');
    console.log('   Monto: Bs. 122.00\n');

    try {
        const { data, error } = await supabase.functions.invoke('bancamiga-verify-payment', {
            body: {
                userId: 'test-verification',
                userPhone: '04145274111',
                bancoOrig: '0102',
                lastFourDigits: '0120',
                expectedAmount: 122.00
            }
        });

        if (error) {
            console.error('❌ Error al invocar la función:', error);
            return;
        }

        console.log('\n📊 Resultado:\n');
        console.log(JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('\n✅ ¡Pago encontrado y verificado!');
            console.log(`   Referencia (refpk): ${data.refpk}`);
            console.log(`   Monto: Bs. ${data.amount}`);
            console.log(`   Fecha: ${data.transactionDate}`);
            console.log(`   Fuente: ${data.source}`);
        } else {
            console.log('\n❌ Pago no encontrado');
            console.log(`   Mensaje: ${data.error}`);
        }
    } catch (err) {
        console.error('\n❌ Error inesperado:', err.message);
    }
}

verifyPayment();
