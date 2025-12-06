// Supabase Edge Function: BANCAMIGA Find Payment
// Endpoint: /functions/v1/bancamiga-find-payment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

        const BANCAMIGA_HOST = Deno.env.get('BANCAMIGA_HOST');
        const BANCAMIGA_ACCESS_TOKEN = Deno.env.get('BANCAMIGA_ACCESS_TOKEN');

        console.log('🔎 Buscando pagos móvil:', { phoneOrig, bankOrig, date });

        const response = await fetch(`${BANCAMIGA_HOST}/public/protected/pm/find`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BANCAMIGA_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Phone: phoneOrig,
                Bank: bankOrig,
                Date: date,
            }),
        });

        const data = await response.json();

        if (data.code !== 200) {
            console.warn('⚠️ Respuesta con código diferente a 200:', data);
        }

        console.log(`✅ Encontrados ${data.num || 0} pagos`);

        // Guardar en BD si hay pagos
        if (data.lista && data.lista.length > 0) {
            const supabaseClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            for (const payment of data.lista) {
                await supabaseClient.from('bank_transactions').upsert({
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
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                totalPayments: data.num || 0,
                payments: data.lista || [],
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
