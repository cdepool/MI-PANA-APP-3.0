// Supabase Edge Function: BANCAMIGA Webhook
// Endpoint: /functions/v1/bancamiga-webhook
// Recibe notificaciones automáticas de pagos móvil

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Validar token del webhook
        const authHeader = req.headers.get('Authorization');
        const expectedToken = Deno.env.get('WEBHOOK_AUTH_TOKEN');

        if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
            console.warn('❌ Intento de webhook no autorizado');
            return new Response(
                JSON.stringify({ Code: 401, error: 'Unauthorized' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 401,
                }
            );
        }

        const paymentData = await req.json();

        console.log('📲 WEBHOOK RECIBIDO:', {
            monto: paymentData.Amount,
            referencia: paymentData.NroReferencia,
            teléfono: paymentData.PhoneOrig,
            fecha: paymentData.FechaMovimiento,
        });

        // Guardar en BD
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: transaction, error } = await supabaseClient
            .from('bank_transactions')
            .insert({
                reference: paymentData.NroReferencia,
                refpk: paymentData.Refpk,
                phone_orig: paymentData.PhoneOrig,
                phone_dest: paymentData.PhoneDest,
                amount: parseFloat(paymentData.Amount),
                bank_orig: paymentData.BancoOrig,
                transaction_date: `${paymentData.FechaMovimiento}T${paymentData.HoraMovimiento}`,
                status: 'received',
                raw_data: paymentData,
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error guardando pago:', error);
            throw error;
        }

        console.log('✅ Pago guardado en BD:', transaction.id);

        // TODO: Aquí puedes agregar lógica adicional:
        // - Buscar orden pendiente con esta referencia
        // - Actualizar saldo de wallet del usuario
        // - Enviar notificación al usuario
        // - Marcar viaje como pagado

        // Respuesta OBLIGATORIA a BANCAMIGA
        return new Response(
            JSON.stringify({
                Code: 200,
                Refpk: paymentData.Refpk,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('❌ Error procesando webhook:', error.message);

        return new Response(
            JSON.stringify({
                Code: 500,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
