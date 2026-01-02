// Wallet Get Balance - Edge Function
// Obtiene el saldo de la billetera con conversión VES/USD

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Get user ID from query params or auth header
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

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // Wallet doesn't exist, return zero balance
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

    // Get current exchange rate
    const { data: exchangeRate } = await supabase
      .rpc('get_current_exchange_rate', { p_rate_type: 'oficial' });

    // Calculate equivalent values
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
