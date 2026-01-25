#!/usr/bin/env node

/**
 * Script de Monitoreo de Tokens de Bancamiga
 * Verifica la expiración de tokens y envía alertas
 * 
 * Uso: node scripts/monitor-bancamiga-tokens.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mdaksestqxfdxpirudsc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurado');
    console.log('Este script requiere la SERVICE_ROLE_KEY para leer los secretos de Edge Functions');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configuración
const WARNING_DAYS = 30; // Alertar 30 días antes de expiración
const CRITICAL_DAYS = 7;  // Crítico 7 días antes

async function checkTokenExpiration() {
    console.log('🔍 Verificando expiración de tokens de Bancamiga...\n');

    try {
        // Obtener el valor de BANCAMIGA_TOKEN_EXPIRES desde los secretos
        // Nota: Esto requiere permisos especiales o acceso directo a Supabase

        // Por ahora, asumimos que el valor está en una variable de entorno
        const tokenExpires = process.env.BANCAMIGA_TOKEN_EXPIRES || '1799819309';
        const expirationTimestamp = parseInt(tokenExpires, 10);

        if (isNaN(expirationTimestamp)) {
            console.error('❌ BANCAMIGA_TOKEN_EXPIRES no es un número válido');
            return;
        }

        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiration = expirationTimestamp - now;
        const daysUntilExpiration = Math.floor(timeUntilExpiration / (24 * 60 * 60));

        const expirationDate = new Date(expirationTimestamp * 1000);

        console.log('📊 Estado de Tokens:');
        console.log('━'.repeat(60));
        console.log(`Fecha de expiración: ${expirationDate.toLocaleString()}`);
        console.log(`Días hasta expiración: ${daysUntilExpiration}`);
        console.log('━'.repeat(60));

        // Determinar el nivel de alerta
        if (daysUntilExpiration < 0) {
            console.log('\n🚨 CRÍTICO: Los tokens han EXPIRADO');
            console.log('Acción requerida: Renovar tokens inmediatamente');
            console.log('Ejecuta: node scripts/regenerate-bancamiga-tokens.js');

            // Enviar notificación (implementar según tu sistema)
            await sendAlert('CRITICAL', `Tokens de Bancamiga EXPIRADOS desde hace ${Math.abs(daysUntilExpiration)} días`);

            process.exit(1);
        } else if (daysUntilExpiration <= CRITICAL_DAYS) {
            console.log(`\n⚠️ CRÍTICO: Los tokens expiran en ${daysUntilExpiration} días`);
            console.log('Acción requerida: Renovar tokens lo antes posible');

            await sendAlert('CRITICAL', `Tokens de Bancamiga expiran en ${daysUntilExpiration} días`);
        } else if (daysUntilExpiration <= WARNING_DAYS) {
            console.log(`\n⚡ ADVERTENCIA: Los tokens expiran en ${daysUntilExpiration} días`);
            console.log('Recomendación: Planificar renovación de tokens');

            await sendAlert('WARNING', `Tokens de Bancamiga expiran en ${daysUntilExpiration} días`);
        } else {
            console.log(`\n✅ OK: Los tokens son válidos por ${daysUntilExpiration} días más`);
        }

        // Guardar registro de monitoreo en la base de datos
        await logMonitoring({
            service: 'bancamiga',
            check_type: 'token_expiration',
            status: daysUntilExpiration < 0 ? 'expired' : daysUntilExpiration <= CRITICAL_DAYS ? 'critical' : daysUntilExpiration <= WARNING_DAYS ? 'warning' : 'ok',
            days_until_expiration: daysUntilExpiration,
            expiration_date: expirationDate.toISOString(),
            metadata: {
                warning_threshold: WARNING_DAYS,
                critical_threshold: CRITICAL_DAYS
            }
        });

    } catch (error) {
        console.error('\n❌ Error al verificar tokens:', error.message);
        process.exit(1);
    }
}

async function sendAlert(level, message) {
    console.log(`\n📧 Enviando alerta [${level}]: ${message}`);

    try {
        // Insertar alerta en la tabla de notificaciones
        const { error } = await supabase
            .from('system_alerts')
            .insert({
                service: 'bancamiga',
                level: level.toLowerCase(),
                message: message,
                metadata: {
                    check: 'token_expiration',
                    timestamp: new Date().toISOString()
                }
            });

        if (error) {
            console.error('Error guardando alerta:', error.message);
        } else {
            console.log('✅ Alerta registrada en la base de datos');
        }

        // Aquí puedes agregar integración con servicios de notificación:
        // - Email (SendGrid, AWS SES)
        // - Slack
        // - Discord
        // - SMS (Twilio)

    } catch (error) {
        console.error('Error enviando alerta:', error.message);
    }
}

async function logMonitoring(data) {
    try {
        const { error } = await supabase
            .from('service_monitoring')
            .insert({
                ...data,
                checked_at: new Date().toISOString()
            });

        if (error && error.code !== '42P01') { // Ignorar si la tabla no existe
            console.error('Error logging monitoring:', error.message);
        }
    } catch (error) {
        // Silenciar errores de logging para no interrumpir el script principal
    }
}

// Ejecutar el monitoreo
checkTokenExpiration();
