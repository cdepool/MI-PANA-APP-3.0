// Wallet Get Transactions - Edge Function
// Obtiene el historial de transacciones de forma segura via RPC
// Evita exponer la tabla wallet_transactions directamente al cliente via RLS

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
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({ error: 'Method not allowed' }),
                { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { userId, type, limit = 10, offset = 0 } = await req.json();

        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'userId is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Build query
        let query = supabase
            .from('wallet_transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (type && type !== 'all') {
            query = query.eq('type', type);
        }

        const { data: transactions, count, error } = await query;

        if (error) {
            throw error;
        }

        return new Response(
            JSON.stringify({
                success: true,
                transactions: transactions || [],
                total: count || 0,
                page: Math.floor(offset / limit) + 1,
                limit
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[Wallet Get Transactions] Error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Failed to fetch transactions',
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
