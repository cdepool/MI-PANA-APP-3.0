// Supabase Edge Function: BANCAMIGA Find Payment
// Endpoint: /functions/v1/bancamiga-find-payment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createBancamigaClient } from '../_shared/bancamigaClient.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { phoneOrig, bankOrig, date } = await req.json();

        // Validar parámetros
        if (!phoneOrig || !bankOrig || !date) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Faltan parámetros: phoneOrig, bankOrig, date',
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                }
            );
        }

        console.log('🔎 Buscando pagos móvil:', { phoneOrig, bankOrig, date });

        const bancamigaClient = createBancamigaClient();
        const payments = await bancamigaClient.searchPayments({
            phoneOrig,
            bancoOrig: bankOrig,
            fechaMovimiento: date,
        });

        console.log(`✅ Encontrados ${payments.length || 0} pagos`);

        // Guardar en BD si hay pagos
        if (payments.length > 0) {
            const supabaseClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            for (const payment of payments) {
                const { error: upsertError } = await supabaseClient.from('bank_transactions').upsert({
                    reference: payment.NroReferencia,
                    refpk: payment.Refpk,
                    phone_orig: payment.PhoneOrig,
                    phone_dest: payment.PhoneDest,
                    amount: payment.Amount,
                    bank_orig: payment.BancoOrig,
                    transaction_date: `${payment.FechaMovimiento}T${payment.HoraMovimiento}`,
                    status: 'pending',
                    raw_data: payment,
                }, {
                    onConflict: 'reference',
                });

                if (upsertError) {
                    console.error(`❌ Error haciendo upsert de pago ${payment.Refpk}:`, upsertError);
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                totalPayments: payments.length,
                payments: payments,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('❌ Error buscando pagos:', error.message);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
