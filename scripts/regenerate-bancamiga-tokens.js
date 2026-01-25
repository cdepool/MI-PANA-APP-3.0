#!/usr/bin/env node

/**
 * Script para regenerar tokens de Bancamiga
 * Uso: node scripts/regenerate-bancamiga-tokens.js
 */

const BANCAMIGA_HOST = process.env.BANCAMIGA_HOST || 'https://adminp2p.sitca-ve.com';
const BANCAMIGA_DNI = process.env.BANCAMIGA_DNI || 'J40724274';
const BANCAMIGA_PASSWORD = process.env.BANCAMIGA_PASSWORD;

if (!BANCAMIGA_PASSWORD) {
    console.error('❌ Error: BANCAMIGA_PASSWORD no está configurado');
    console.log('\nAgrega la variable de entorno:');
    console.log('export BANCAMIGA_PASSWORD="tu_contraseña_aquí"');
    process.exit(1);
}

async function generateTokens() {
    console.log('🔐 Generando nuevos tokens de Bancamiga...');
    console.log(`📍 Host: ${BANCAMIGA_HOST}`);
    console.log(`👤 DNI: ${BANCAMIGA_DNI}`);

    try {
        const response = await fetch(`${BANCAMIGA_HOST}/public/auth/security/users/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Dni: BANCAMIGA_DNI,
                Pass: BANCAMIGA_PASSWORD,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('\n✅ Tokens generados exitosamente!\n');
        console.log('📋 Copia estos valores a Supabase Dashboard → Edge Functions → Secrets:\n');
        console.log('━'.repeat(80));
        console.log(`BANCAMIGA_ACCESS_TOKEN=${data.token}`);
        console.log(`BANCAMIGA_REFRESH_TOKEN=${data.refresToken}`);
        console.log(`BANCAMIGA_TOKEN_EXPIRES=${data.expireDate}`);
        console.log('━'.repeat(80));

        // Calcular cuándo expira
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = data.expireDate - now;
        const hours = Math.floor(expiresIn / 3600);
        const days = Math.floor(hours / 24);

        console.log(`\n⏰ Estos tokens expirarán en aproximadamente ${days} días y ${hours % 24} horas`);
        console.log(`   Fecha de expiración: ${new Date(data.expireDate * 1000).toLocaleString()}\n`);

    } catch (error) {
        console.error('\n❌ Error al generar tokens:', error.message);
        process.exit(1);
    }
}

generateTokens();
