// Supabase Edge Function: BANCAMIGA Health Check
// Endpoint: /functions/v1/bancamiga-health

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const BANCAMIGA_HOST = Deno.env.get('BANCAMIGA_HOST');

        if (!BANCAMIGA_HOST) {
            throw new Error('BANCAMIGA_HOST no configurado');
        }

        console.log('🔍 Ejecutando health check con BANCAMIGA...');

        const response = await fetch(`${BANCAMIGA_HOST}/healthcheck`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('✅ Health check exitoso:', data);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Conexión con BANCAMIGA activa',
                data,
                timestamp: new Date().toISOString(),
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('❌ Health check fallido:', error.message);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
