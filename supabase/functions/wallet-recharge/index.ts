// Wallet Recharge - Edge Function
// Procesa solicitudes de recarga de billetera vía Pago Móvil

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createBancamigaClient } from '../_shared/bancamigaClient.ts';

interface RechargeRequest {
  userId: string;
  userPhone: string;
  amount: number;
  bancoOrig: string;
  lastFourDigits: string;
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

    const body: RechargeRequest = await req.json();

    console.log('[Wallet Recharge] Request:', {
      userId: body.userId,
      amount: body.amount,
      bank: body.bancoOrig,
      lastDigits: body.lastFourDigits,
    });

    // Validate required fields
    if (!body.userId || !body.userPhone || !body.amount || !body.bancoOrig || !body.lastFourDigits) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Faltan datos requeridos para la recarga'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount
    if (body.amount <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'El monto debe ser mayor a cero'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate last 4 digits
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

    let cleanPhone = body.userPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '58' + cleanPhone.substring(1);
    }

    console.log('[Wallet Recharge] Step 1: Get or create wallet');
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', body.userId)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      console.log('[Wallet Recharge] Wallet not found, creating...');
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: body.userId,
          balance_ves: 0,
          balance_usd: 0,
          status: 'active',
        })
        .select()
        .single();

      if (createError) {
        console.error('[Wallet Recharge] Error creating wallet:', createError);
        throw createError;
      }

      wallet = newWallet;
    } else if (walletError) {
      console.error('[Wallet Recharge] Error fetching wallet:', walletError);
      throw walletError;
    }

    console.log('[Wallet Recharge] Step 2: Create recharge request');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data: rechargeRequest, error: requestError } = await supabase
      .from('recharge_requests')
      .insert({
        wallet_id: wallet!.id,
        user_id: body.userId,
        amount: body.amount, // Required by DB schema
        currency: 'VES',
        amount_ves: body.amount,
        bank_orig: body.bancoOrig,
        last_four_digits: body.lastFourDigits,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (requestError) {
      console.error('[Wallet Recharge] Error creating recharge request:', requestError);
      throw requestError;
    }

    console.log('[Wallet Recharge] Step 3: Verify payment with Bancamiga');
    try {
      // First check database
      console.log('[Wallet Recharge] Checking local bank_transactions...');
      const { data: existingPayments } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('phone_orig', cleanPhone)
        .eq('bank_orig', body.bancoOrig)
        .order('transaction_date', { ascending: false });

      let matchingPayment = null;

      if (existingPayments && existingPayments.length > 0) {
        console.log(`[Wallet Recharge] Found ${existingPayments.length} existing transactions`);
        matchingPayment = existingPayments.find((payment) => {
          const refMatch = payment.reference.endsWith(body.lastFourDigits);
          const amountMatch = Math.abs(parseFloat(payment.amount) - body.amount) <= 0.01;
          return refMatch && amountMatch && !payment.matched_wallet_transaction_id;
        });
      }

      if (matchingPayment) {
        console.log('[Wallet Recharge] Found matching transaction in database!');
      } else {
        console.log('[Wallet Recharge] No match in database. Querying Bancamiga API...');
        const bancamigaClient = createBancamigaClient();
        const payment = await bancamigaClient.findPaymentByReference({
          phoneOrig: cleanPhone,
          bancoOrig: body.bancoOrig,
          referenceDigits: body.lastFourDigits,
          expectedAmount: body.amount,
          dateRange: 3,
        });

        if (!payment) {
          console.log('[Wallet Recharge] Payment not found via API');
          await supabase
            .from('recharge_requests')
            .update({ status: 'failed' })
            .eq('id', rechargeRequest.id);

          return new Response(
            JSON.stringify({
              success: false,
              error: 'No se encontró el pago en Bancamiga.',
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[Wallet Recharge] Payment found via API! Validating bank...');
        if (payment.BancoOrig !== body.bancoOrig) {
          console.warn(`[Wallet Recharge] Bank mismatch: Expected ${body.bancoOrig}, got ${payment.BancoOrig}`);
          await supabase
            .from('recharge_requests')
            .update({ status: 'failed' })
            .eq('id', rechargeRequest.id);

          return new Response(
            JSON.stringify({
              success: false,
              error: `El pago fue realizado desde ${payment.BancoOrig}, pero indicaste ${body.bancoOrig}.`,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[Wallet Recharge] Saving payment to database...');
        const transactionDateTime = new Date(`${payment.FechaMovimiento}T${payment.HoraMovimiento}`);
        const { data: newPayment, error: paymentError } = await supabase
          .from('bank_transactions')
          .insert({
            reference: payment.NroReferencia,
            refpk: payment.Refpk,
            phone_orig: payment.PhoneOrig,
            phone_dest: payment.PhoneDest,
            amount: parseFloat(payment.Amount.toString()),
            bank_orig: payment.BancoOrig,
            transaction_date: transactionDateTime.toISOString(),
            status: 'matched',
            matched_user_id: body.userId,
            raw_data: payment,
          })
          .select()
          .single();

        if (paymentError) {
          console.error('[Wallet Recharge] Failed to save payment:', paymentError);
          throw paymentError;
        }
        matchingPayment = newPayment;
      }

      // Step 4: Process recharge
      if (matchingPayment) {
        console.log('[Wallet Recharge] Processing recharge with payment ID:', matchingPayment.id);
        const { data: result, error: processError } = await supabase
          .rpc('process_recharge', {
            p_recharge_request_id: rechargeRequest.id,
            p_bank_transaction_id: matchingPayment.id,
          });

        if (processError) {
          console.error('[Wallet Recharge] RPC process_recharge error:', processError);
          throw processError;
        }

        const { data: updatedWallet } = await supabase
          .from('wallets')
          .select('balance_ves, balance_usd')
          .eq('id', wallet!.id)
          .single();

        console.log('[Wallet Recharge] Recharge completed successfully!');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Recarga exitosa',
            wallet: {
              balance_ves: updatedWallet?.balance_ves || 0,
              balance_usd: updatedWallet?.balance_usd || 0,
            },
            transaction: {
              amount: body.amount,
              reference: matchingPayment.reference,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (apiError) {
      console.error('[Wallet Recharge] Bancamiga API Flow Error:', apiError);
      throw apiError;
    }

  } catch (error) {
    console.error('[Wallet Recharge] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor.',
        details: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
