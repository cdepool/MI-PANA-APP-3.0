// Bancamiga Automatic Payment Verification
// Verifies mobile payments using last 4 digits of reference and user's phone

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createBancamigaClient } from '../_shared/bancamigaClient.ts';

interface VerifyPaymentRequest {
  userId: string;
  userPhone: string;
  bancoOrig: string;
  lastFourDigits: string;
  expectedAmount: number;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: VerifyPaymentRequest = await req.json();

    console.log('[Verify Payment] Request:', {
      userId: body.userId,
      phone: body.userPhone,
      bank: body.bancoOrig,
      lastDigits: body.lastFourDigits,
      amount: body.expectedAmount,
    });

    // Validate required fields
    if (!body.userId || !body.userPhone || !body.bancoOrig || !body.lastFourDigits || !body.expectedAmount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Faltan datos requeridos para la verificación'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate last 4 digits format
    if (body.lastFourDigits.length !== 4 || !/^\d{4}$/.test(body.lastFourDigits)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Los últimos 4 dígitos deben ser exactamente 4 números'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clean phone number (remove any formatting)
    const cleanPhone = body.userPhone.replace(/\D/g, '');

    // Step 1: Check if payment already exists in database
    const { data: existingPayments } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('phone_orig', cleanPhone)
      .eq('bank_orig', body.bancoOrig)
      .gte('transaction_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('transaction_date', { ascending: false });

    if (existingPayments && existingPayments.length > 0) {
      // Search in existing payments
      const matchingPayment = existingPayments.find((payment) => {
        const refMatch = payment.reference.endsWith(body.lastFourDigits);
        const amountMatch = Math.abs(parseFloat(payment.amount) - body.expectedAmount) <= 0.01;
        return refMatch && amountMatch;
      });

      if (matchingPayment) {
        console.log('[Verify Payment] Found in database:', matchingPayment.refpk);

        // Update status if needed
        if (matchingPayment.status === 'pending') {
          await supabase
            .from('bank_transactions')
            .update({
              status: 'verified',
              matched_user_id: body.userId,
            })
            .eq('id', matchingPayment.id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            refpk: matchingPayment.refpk,
            amount: matchingPayment.amount,
            transactionDate: matchingPayment.transaction_date,
            source: 'database',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Step 2: Query Bancamiga API
    console.log('[Verify Payment] Querying Bancamiga API...');

    try {
      const bancamigaClient = createBancamigaClient();

      // Search in the last 3 days
      const payment = await bancamigaClient.findPaymentByReference({
        phoneOrig: cleanPhone,
        referenceDigits: body.lastFourDigits,
        expectedAmount: body.expectedAmount,
        dateRange: 3,
      });

      if (!payment) {
        console.log('[Verify Payment] Payment not found');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'No se encontró el pago. Verifica que los datos sean correctos y que el pago se haya realizado en las últimas 72 horas.',
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate bank origin
      if (payment.BancoOrig !== body.bancoOrig) {
        console.log('[Verify Payment] Bank mismatch');
        return new Response(
          JSON.stringify({
            success: false,
            error: `El pago fue realizado desde ${payment.BancoOrig}, pero indicaste ${body.bancoOrig}. Por favor verifica el banco.`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[Verify Payment] Found in Bancamiga API:', payment.Refpk);

      // Save to database
      const transactionDateTime = new Date(`${payment.FechaMovimiento}T${payment.HoraMovimiento}`);

      const { data: newTransaction, error: insertError } = await supabase
        .from('bank_transactions')
        .insert({
          reference: payment.NroReferencia,
          refpk: payment.Refpk,
          phone_orig: payment.PhoneOrig,
          phone_dest: payment.PhoneDest,
          amount: payment.Amount,
          bank_orig: payment.BancoOrig,
          transaction_date: transactionDateTime.toISOString(),
          status: 'verified',
          matched_user_id: body.userId,
          raw_data: payment,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Verify Payment] Database insert error:', insertError);

        // Payment found but couldn't save - still return success
        return new Response(
          JSON.stringify({
            success: true,
            refpk: payment.Refpk,
            amount: payment.Amount,
            transactionDate: transactionDateTime.toISOString(),
            source: 'bancamiga_api',
            warning: 'Pago verificado pero no se pudo guardar en la base de datos',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          refpk: newTransaction.refpk,
          amount: newTransaction.amount,
          transactionDate: newTransaction.transaction_date,
          source: 'bancamiga_api',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (apiError) {
      console.error('[Verify Payment] Bancamiga API error:', apiError);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al consultar Bancamiga. Por favor intenta nuevamente en unos momentos.',
          details: apiError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[Verify Payment] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor. Por favor intenta nuevamente.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
