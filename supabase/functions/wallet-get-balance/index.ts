// Wallet Get Balance - Edge Function
// Obtiene el saldo de la billetera con conversión VES/USD
// Implementa Lazy Sync para tasa de cambio

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cache for exchange rate (5 minutes TTL)
let exchangeRateCache: { rate: number; timestamp: number; date: string } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user ID from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get Wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // Wallet doesn't exist, return zero balance (implicit initialization could happen here too)
      return new Response(
        JSON.stringify({
          success: true,
          wallet: {
            balance_ves: 0,
            balance_usd: 0,
            status: 'inactive',
          },
          exchange_rate: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (walletError) {
      throw walletError;
    }

    // 2. Get Exchange Rate (Lazy Sync Implementation)
    let exchangeRate = 0;
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // A. Check Memory Cache
    if (exchangeRateCache && (now - exchangeRateCache.timestamp) < CACHE_TTL_MS && exchangeRateCache.date === today) {
      console.log('[Wallet Get Balance] Using cached exchange rate');
      exchangeRate = exchangeRateCache.rate;
    } else {
      console.log('[Wallet Get Balance] Cache miss or stale. Checking DB for TODAY:', today);

      // B. Check DB for today's rate
      const { data: dbRate } = await supabase
        .from('exchange_rates')
        .select('*')
        .eq('effective_date', today)
        .eq('rate_type', 'oficial')
        .maybeSingle();

      if (dbRate) {
        console.log('[Wallet Get Balance] Found rate in DB');
        exchangeRate = dbRate.rate;
      } else {
        // C. Logic Empty/Stale -> Fetch from API (Lazy Sync)
        console.log('[Wallet Get Balance] Rate not found in DB for today. Fetching from API...');
        try {
          const apiRes = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            exchangeRate = apiData.promedio;
            console.log('[Wallet Get Balance] Fetched from API:', exchangeRate);

            // D. Persist to DB (for other users/requests)
            // Use upsert to avoid race conditions with cron or other requests
            await supabase.from('exchange_rates').upsert({
              rate: exchangeRate,
              source: 'dolarapi.com (lazy-sync)',
              rate_type: 'oficial',
              effective_date: today
            }, { onConflict: 'effective_date, rate_type' });

          } else {
            throw new Error('API request failed');
          }
        } catch (apiError) {
          console.error('[Wallet Get Balance] API Fetch failed:', apiError);
          // E. Fallback to latest available rate
          const { data: latest } = await supabase
            .from('exchange_rates')
            .select('rate')
            .eq('rate_type', 'oficial')
            .order('effective_date', { ascending: false })
            .limit(1)
            .single();
          exchangeRate = latest?.rate || 0;
        }
      }

      // Update Memory Cache
      exchangeRateCache = {
        rate: exchangeRate,
        timestamp: now,
        date: today
      };
    }

    // 3. Calculate equivalent values
    const vesEquivalent = wallet.balance_ves + (wallet.balance_usd * (exchangeRate || 0));
    const usdEquivalent = wallet.balance_usd + (wallet.balance_ves / (exchangeRate || 1));

    return new Response(
      JSON.stringify({
        success: true,
        wallet: {
          balance_ves: parseFloat(wallet.balance_ves),
          balance_usd: parseFloat(wallet.balance_usd),
          status: wallet.status,
          ves_equivalent: Math.round(vesEquivalent * 100) / 100,
          usd_equivalent: Math.round(usdEquivalent * 100) / 100,
        },
        exchange_rate: exchangeRate || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Wallet Get Balance] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to get wallet balance',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
