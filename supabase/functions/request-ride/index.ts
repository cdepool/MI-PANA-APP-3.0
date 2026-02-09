import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Initialize Supabase Client with Auth Context
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 2. Verify User
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) {
            throw new Error("Unauthorized: Invalid Token")
        }

        const { origin, destination, vehicle_type } = await req.json()
        const userId = user.id // SECURE: Use ID from token, not body

        // Mock logic: Create a ride ID and return success
        // In production: Insert into 'rides' table and notify drivers via Realtime
        const rideId = crypto.randomUUID();

        const responseData = {
            ride_id: rideId,
            passenger_id: userId,
            status: 'searching',
            message: 'Buscando conductores cercanos... (Secure Mode)',
        }

        return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        })
    }
})
