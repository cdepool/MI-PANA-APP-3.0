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

    const cleanPhone = body.userPhone.replace(/\D/g, '');

    // Step 1: Get or create wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', body.userId)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // Wallet doesn't exist, create it
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
        throw createError;
      }

      wallet = newWallet;
      console.log('[Wallet Recharge] Created new wallet for user:', body.userId);
    } else if (walletError) {
      throw walletError;
    }

    if (!wallet) {
      throw new Error('Failed to get or create wallet');
    }

    // Check wallet status
    if (wallet.status !== 'active') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Tu billetera está suspendida. Contacta a soporte.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Create recharge request
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    const { data: rechargeRequest, error: requestError } = await supabase
      .from('recharge_requests')
      .insert({
        wallet_id: wallet.id,
        user_id: body.userId,
        amount_ves: body.amount,
        bank_orig: body.bancoOrig,
        last_four_digits: body.lastFourDigits,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (requestError) {
      throw requestError;
    }

    console.log('[Wallet Recharge] Created recharge request:', rechargeRequest.id);

    // Step 3: Verify payment with Bancamiga
    try {
      // First check database
      const { data: existingPayments } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('phone_orig', cleanPhone)
        .eq('bank_orig', body.bancoOrig)
        .gte('transaction_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('transaction_date', { ascending: false });

      let matchingPayment = null;

      if (existingPayments && existingPayments.length > 0) {
        matchingPayment = existingPayments.find((payment) => {
          const refMatch = payment.reference.endsWith(body.lastFourDigits);
          const amountMatch = Math.abs(parseFloat(payment.amount) - body.amount) <= 0.01;
          return refMatch && amountMatch && !payment.matched_wallet_transaction_id;
        });
      }

      // If not in database, query Bancamiga API
      if (!matchingPayment) {
        console.log('[Wallet Recharge] Querying Bancamiga API...');
        
        const bancamigaClient = createBancamigaClient();
        const payment = await bancamigaClient.findPaymentByReference({
          phoneOrig: cleanPhone,
          referenceDigits: body.lastFourDigits,
          expectedAmount: body.amount,
          dateRange: 3,
        });

        if (!payment) {
          // Payment not found - mark request as failed
          await supabase
            .from('recharge_requests')
            .update({ status: 'failed' })
            .eq('id', rechargeRequest.id);

          return new Response(
            JSON.stringify({
              success: false,
              error: 'No se encontró el pago. Verifica que los datos sean correctos y que el pago se haya realizado en las últimas 72 horas.',
            }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate bank
        if (payment.BancoOrig !== body.bancoOrig) {
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

        // Save payment to database
        const transactionDateTime = new Date(`${payment.FechaMovimiento}T${payment.HoraMovimiento}`);
        
        const { data: newPayment, error: paymentError } = await supabase
          .from('bank_transactions')
          .insert({
            reference: payment.NroReferencia,
            refpk: payment.Refpk,
            phone_orig: payment.PhoneOrig,
            phone_dest: payment.PhoneDest,
            amount: parseFloat(payment.Amount),
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
        } else {
          matchingPayment = newPayment;
        }
      }

      // Step 4: Process recharge
      if (matchingPayment) {
        console.log('[Wallet Recharge] Processing recharge with payment:', matchingPayment.refpk);

        // Call stored procedure to process recharge
        const { data: result, error: processError } = await supabase
          .rpc('process_recharge', {
            p_recharge_request_id: rechargeRequest.id,
            p_bank_transaction_id: matchingPayment.id,
          });

        if (processError) {
          throw processError;
        }

        // Get updated wallet balance
        const { data: updatedWallet } = await supabase
          .from('wallets')
          .select('balance_ves, balance_usd')
          .eq('id', wallet.id)
          .single();

        console.log('[Wallet Recharge] Recharge completed successfully');

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
      console.error('[Wallet Recharge] Bancamiga API error:', apiError);
      
      // Mark request as failed
      await supabase
        .from('recharge_requests')
        .update({ status: 'failed' })
        .eq('id', rechargeRequest.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error al verificar el pago. Por favor intenta nuevamente.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[Wallet Recharge] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor. Por favor intenta nuevamente.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
