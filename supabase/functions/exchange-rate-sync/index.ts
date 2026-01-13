// Exchange Rate Sync - Edge Function
// Sincroniza la tasa de cambio VES/USD desde DolarAPI.com

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface DolarAPIResponse {
  promedio: number;
  fecha: string;
  nombre: string;
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
    console.log('[Exchange Rate Sync] Starting sync...');

    // Fetch exchange rate from DolarAPI
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');

    if (!response.ok) {
      throw new Error(`DolarAPI returned ${response.status}`);
    }

    const data: DolarAPIResponse = await response.json();

    console.log('[Exchange Rate Sync] Fetched rate:', data.promedio, 'VES/USD');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Check if rate already exists for today
    const { data: existingRate } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('effective_date', today)
      .eq('rate_type', 'oficial')
      .single();

    if (existingRate) {
      // Update existing rate
      const { error: updateError } = await supabase
        .from('exchange_rates')
        .update({
          rate: data.promedio,
          source: 'dolarapi.com',
        })
        .eq('id', existingRate.id);

      if (updateError) {
        throw updateError;
      }

      console.log('[Exchange Rate Sync] Updated existing rate');

      return new Response(
        JSON.stringify({
          success: true,
          action: 'updated',
          rate: data.promedio,
          date: today,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Insert new rate
      const { error: insertError } = await supabase
        .from('exchange_rates')
        .insert({
          rate: data.promedio,
          source: 'dolarapi.com',
          rate_type: 'oficial',
          effective_date: today,
        });

      if (insertError) {
        throw insertError;
      }

      console.log('[Exchange Rate Sync] Inserted new rate');

      return new Response(
        JSON.stringify({
          success: true,
          action: 'inserted',
          rate: data.promedio,
          date: today,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[Exchange Rate Sync] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to sync exchange rate',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
