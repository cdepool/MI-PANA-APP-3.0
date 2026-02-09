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
        const { origin, destination, vehicle_type } = await req.json()

        // Mock logic: Calculate price based on hypothetical distance
        // In production: Use Google Maps Distance Matrix API

        let basePrice = 2.00;
        let pricePerKm = 0.50;

        if (vehicle_type === 'moto') {
            basePrice = 1.00;
            pricePerKm = 0.30;
        }

        // Mock distance ~5km
        const estimatedPrice = basePrice + (5 * pricePerKm);
        const estimatedTime = "10-15 min";

        return new Response(JSON.stringify({
            price: estimatedPrice,
            time: estimatedTime,
            distance_km: 5
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
