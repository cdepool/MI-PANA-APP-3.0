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
            amount: paymentData.Amount,
            reference: paymentData.NroReferencia,
            phone: paymentData.PhoneOrig,
            bank: paymentData.BancoOrig,
            date: paymentData.FechaMovimiento,
        });

        // Guardar en BD
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: transaction, error: insertError } = await supabaseClient
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

        if (insertError) {
            console.error('❌ Error guardando pago:', insertError);
            // Si el error es duplicado de referencia, podríamos intentar procesarlo igual
            if (insertError.code !== '23505') {
                throw insertError;
            }
        }

        console.log('✅ Pago registrado:', transaction?.id || 'Ya existía');

        // Lógica de Matching Automático para Recargas
        if (transaction || insertError.code === '23505') {
            const refForMatch = paymentData.NroReferencia.slice(-4);
            const amountForMatch = parseFloat(paymentData.Amount);
            const phoneForMatch = paymentData.PhoneOrig.replace(/\D/g, '').slice(-10); // Últimos 10 dígitos

            console.log(`🔎 Buscando coincidencia para: Tel ${phoneForMatch}, Monto ${amountForMatch}, Ref ${refForMatch}`);

            // Buscar solicitud de recarga pendiente
            const { data: rechargeRequest } = await supabaseClient
                .from('recharge_requests')
                .select('*')
                .eq('status', 'pending')
                .eq('last_four_digits', refForMatch)
                .eq('amount_ves', amountForMatch)
                .filter('bank_orig', 'eq', paymentData.BancoOrig)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (rechargeRequest) {
                console.log('🎯 Coincidencia encontrada! Procesando recarga...', rechargeRequest.id);

                // Ejecutar procedimiento almacenado de procesamiento
                const { data: result, error: processError } = await supabaseClient.rpc('process_recharge', {
                    p_recharge_request_id: rechargeRequest.id,
                    p_bank_transaction_id: transaction?.id || (await supabaseClient
                        .from('bank_transactions')
                        .select('id')
                        .eq('reference', paymentData.NroReferencia)
                        .single()).data?.id
                });

                if (processError) {
                    console.error('❌ Error al procesar recarga:', processError);
                } else {
                    console.log('🎉 Recarga procesada exitosamente!');

                    // Actualizar status a 'verified' en bank_transactions (si no lo hizo ya el RPC)
                    await supabaseClient
                        .from('bank_transactions')
                        .update({ status: 'verified' })
                        .eq('id', transaction?.id || result.p_bank_transaction_id);
                }
            } else {
                console.log('ℹ️ No se encontró una solicitud de recarga pendiente que coincida.');
            }
        }

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
