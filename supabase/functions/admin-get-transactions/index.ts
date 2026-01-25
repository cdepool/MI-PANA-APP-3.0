// Admin Get Transactions - Edge Function
// Agrega logs de viajes y transacciones de billetera de forma segura
// Verifica rol de ADMIN antes de devolver datos

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verificar Autenticación (Usuario Logueado)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        // 2. Verificar Rol de ADMIN (Service Role Bypass)
        // Usamos Service Role para consultar el perfil del usuario de forma segura
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, admin_role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'ADMIN' && !profile?.admin_role) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: corsHeaders });
        }

        // 3. Procesar Parámetros
        const { limit = 100 } = await req.json();
        const halfLimit = Math.ceil(limit / 2);

        // 4. Fetch Data (Parallel)
        const [tripsResponse, walletResponse] = await Promise.all([
            supabaseAdmin
                .from('trips')
                .select('id, priceUsd, priceVes, status, created_at, passenger:profiles!passenger_id(name)')
                .eq('status', 'COMPLETED')
                .order('created_at', { ascending: false })
                .limit(halfLimit),
            supabaseAdmin
                .from('wallet_transactions')
                .select('id, type, amount_usd, amount_ves, status, created_at, reference, wallet:wallets(user:profiles(name))')
                .order('created_at', { ascending: false })
                .limit(halfLimit)
        ]);

        if (tripsResponse.error) throw tripsResponse.error;
        if (walletResponse.error) throw walletResponse.error;

        // 5. Normalizar Datos
        const tripEntries = (tripsResponse.data || []).map((t: any) => ({
            id: t.id,
            type: 'trip',
            amount_usd: t.priceUsd || 0,
            amount_ves: t.priceVes || 0,
            user_name: t.passenger?.name || 'Desconocido',
            status: t.status,
            created_at: t.created_at,
            reference: `TRIP-${t.id.slice(0, 8)}`,
        }));

        const walletEntries = (walletResponse.data || []).map((t: any) => ({
            id: t.id,
            type: t.type,
            amount_usd: t.amount_usd || 0,
            amount_ves: t.amount_ves || 0,
            user_name: t.wallet?.user?.name || 'Desconocido',
            status: t.status,
            created_at: t.created_at,
            reference: t.reference || `TX-${t.id.slice(0, 8)}`,
        }));

        // 6. Merge & Sort
        const combined = [...tripEntries, ...walletEntries]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, limit);

        return new Response(
            JSON.stringify({ success: true, data: combined }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
