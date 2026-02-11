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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // 0. SECURITY CHECK: Verify User Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (user.id !== body.userId) {
      console.warn(`[Wallet Recharge] Security Alert: User ${user.id} tried to recharge for ${body.userId}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You can only recharge your own wallet' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Validate wallet status
    if (wallet!.status !== 'active') {
      console.warn(`[Wallet Recharge] Wallet status is ${wallet!.status}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Tu billetera está ${wallet!.status}. Contacta a soporte para activarla antes de realizar recargas.`,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: Check recent failed attempts (max 3 in 5 minutes)
    console.log('[Wallet Recharge] Checking rate limiting...');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const { data: recentAttempts } = await supabase
      .from('recharge_requests')
      .select('created_at')
      .eq('user_id', body.userId)
      .gte('created_at', fiveMinutesAgo.toISOString())
      .eq('status', 'failed');

    if (recentAttempts && recentAttempts.length >= 3) {
      console.warn(`[Wallet Recharge] Rate limit exceeded: ${recentAttempts.length} failed attempts in last 5 minutes`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Demasiados intentos fallidos. Por favor espera 5 minutos antes de intentar nuevamente.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SPAM PREVENTION: Check for too many PENDING requests
    const { count: pendingCount } = await supabase
      .from('recharge_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', body.userId)
      .eq('status', 'pending');

    if (pendingCount && pendingCount >= 5) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Tienes demasiadas solicitudes de recarga pendientes. Por favor espera a que se procesen o contacta a soporte.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate successful recharges (same bank + last 4 digits in last 24 hours)
    console.log('[Wallet Recharge] Checking for duplicates...');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: existingRecharge } = await supabase
      .from('recharge_requests')
      .select('*')
      .eq('user_id', body.userId)
      .eq('bank_orig', body.bancoOrig)
      .eq('last_four_digits', body.lastFourDigits)
      .eq('status', 'completed')
      .gte('created_at', twentyFourHoursAgo.toISOString());

    if (existingRecharge && existingRecharge.length > 0) {
      console.warn('[Wallet Recharge] Duplicate payment detected');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Este pago ya fue registrado anteriormente. Si crees que es un error, contacta a soporte.',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Wallet Recharge] Step 2: Create recharge request');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data: rechargeRequest, error: requestError } = await supabase
      .from('recharge_requests')
      .insert({
        wallet_id: wallet!.id,
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
          const notUsed = !payment.matched_wallet_transaction_id;
          console.log(`[Wallet Recharge] Checking payment ${payment.reference}: refMatch=${refMatch}, amountMatch=${amountMatch}, notUsed=${notUsed}`);
          return refMatch && amountMatch && notUsed;
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

          // Debug info: Check if ANY payments were returned for today
          const bancamigaClientTemp = createBancamigaClient();
          const todayStr = new Date().toISOString().split('T')[0];
          const allPaymentsToday = await bancamigaClientTemp.searchPayments({
            phoneOrig: cleanPhone,
            bancoOrig: body.bancoOrig,
            fechaMovimiento: todayStr
          });

          let debugMsg = '';
          if (allPaymentsToday.length > 0) {
            debugMsg = `\n\nEl banco encontró ${allPaymentsToday.length} pagos hoy, pero ninguno coincide con la referencia '${body.lastFourDigits}' y el monto Bs. ${body.amount.toFixed(2)}.`;
          } else {
            debugMsg = `\n\nEl banco no devolvió ningún pago para el teléfono ${cleanPhone} en la fecha de hoy.`;
          }

          await supabase
            .from('recharge_requests')
            .update({ status: 'failed' })
            .eq('id', rechargeRequest.id);

          return new Response(
            JSON.stringify({
              success: false,
              error: 'No se encontró el pago en Bancamiga. Verifica que:\n1. Los últimos 4 dígitos sean correctos\n2. El pago se haya realizado en las últimas 72 horas\n3. El monto sea exactamente Bs. ' + body.amount.toFixed(2) + debugMsg,
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

        // EXACT AMOUNT VALIDATION
        console.log('[Wallet Recharge] Validating exact amount...');
        const paymentAmount = parseFloat(payment.Amount.toString());
        const requestedAmount = parseFloat(body.amount.toFixed(2));
        const amountDifference = Math.abs(paymentAmount - requestedAmount);

        console.log('[Wallet Recharge] Amount comparison:', {
          requested: requestedAmount,
          paid: paymentAmount,
          difference: amountDifference,
          matches: amountDifference <= 0.01
        });

        if (amountDifference > 0.01) {
          console.warn(`[Wallet Recharge] Amount mismatch: requested ${requestedAmount}, paid ${paymentAmount}`);
          await supabase
            .from('recharge_requests')
            .update({ status: 'failed' })
            .eq('id', rechargeRequest.id);

          return new Response(
            JSON.stringify({
              success: false,
              error: `El monto pagado (Bs. ${paymentAmount.toFixed(2)}) no coincide con el monto solicitado (Bs. ${requestedAmount.toFixed(2)}). Por favor verifica e intenta nuevamente con el monto exacto.`,
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[Wallet Recharge] Amount validation passed!');


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

        // Send Push Notification
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              user_id: body.userId,
              title: '💰 Recarga Exitosa',
              body: `Se han acreditado Bs. ${body.amount.toFixed(2)} a tu billetera.`,
              type: 'wallet_recharge',
              data: {
                amount_ves: body.amount.toString(),
                new_balance_usd: updatedWallet?.balance_usd.toString() || '0'
              }
            }),
          });
        } catch (notificationError) {
          console.error('[Wallet Recharge] Failed to send push notification:', notificationError);
          // Don't fail the whole request if notification fails
        }

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

      // Detectar tipo de error específico para dar mejor feedback
      const errorMessage = (apiError as Error).message?.toLowerCase() || '';

      // Error de autenticación con Bancamiga (token expirado)
      if (errorMessage.includes('token') || errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        console.error('[Wallet Recharge] Bancamiga authentication error - token may be expired');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Error de autenticación con el banco. Por favor intenta nuevamente en unos minutos.',
            code: 'BANCAMIGA_AUTH_ERROR'
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Error de conexión con Bancamiga
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('econnrefused')) {
        console.error('[Wallet Recharge] Bancamiga connection error');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'No se pudo conectar con el banco. Por favor verifica tu conexión e intenta nuevamente.',
            code: 'BANCAMIGA_CONNECTION_ERROR'
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Error de respuesta inválida de Bancamiga
      if (errorMessage.includes('json') || errorMessage.includes('parse') || errorMessage.includes('unexpected')) {
        console.error('[Wallet Recharge] Bancamiga response parsing error');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Respuesta inesperada del banco. Por favor intenta nuevamente.',
            code: 'BANCAMIGA_PARSE_ERROR'
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Otros errores - re-throw para el catch general
      throw apiError;
    }

  } catch (error: any) {
    console.error('[Wallet Recharge] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor.',
        details: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
