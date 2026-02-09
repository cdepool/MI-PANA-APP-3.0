import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { ride_id, amount, method, payment_details } = await req.json()

        // Mock logic: Process payment via Bancamiga or Wallet
        // In production: Call Bancamiga API or update 'wallet_transactions' table

        const success = true;
        const transactionId = crypto.randomUUID();

        return new Response(JSON.stringify({
            success,
            transaction_id: transactionId,
            message: 'Pago procesado exitosamente'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
