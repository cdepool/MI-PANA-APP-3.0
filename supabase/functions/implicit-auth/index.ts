
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            // Supabase API URL - env var automatically populated by Supabase
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase Service Role Key - env var automatically populated by Supabase
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { name, phone } = await req.json()

        if (!phone) {
            throw new Error('Phone number is required')
        }

        // 1. Sanitize Phone to create a deterministic Email
        // Remove symbols, spaces. e.g. "+58 412" -> "58412"
        const cleanPhone = phone.replace(/[^0-9]/g, '')
        const email = `${cleanPhone}@mipana.app`

        // 2. Deterministic Password (In production this should be a secret env var + salt)
        const SECRET_SALT = "MIPANA_IMPLICIT_AUTH_2025"
        const password = `${cleanPhone}${SECRET_SALT}`

        // 3. Try to Sign In first
        const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        })

        if (signInData.session) {
            // Login successful
            return new Response(
                JSON.stringify({
                    session: signInData.session,
                    user: signInData.user,
                    isNewUser: false
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        // 4. If Sign In failed, try to Sign Up
        // We use the Admin API (Service Role) to force creation without email confirmation if needed,
        // or just standard signUp if email confirmation is disabled. 
        // Ideally 'email_confirm' is off for these dummy emails, or auto-confirmed.

        const { data: signUpData, error: signUpError } = await supabaseClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm
            user_metadata: {
                full_name: name || 'Usuario Móvil',
                phone: phone,
                role: 'PASSENGER', // Default role
                is_implicit: true
            }
        })

        if (signUpError) {
            // If it failed because user exists (race condition), try sign in again?
            // Or return error.
            throw signUpError
        }

        // After Admin Create User, we don't get a session strictly. 
        // We need to Sign In to get the session token.
        const { data: finalSignIn, error: finalError } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        })

        if (finalError) throw finalError

        return new Response(
            JSON.stringify({
                session: finalSignIn.session,
                user: finalSignIn.user,
                isNewUser: true
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
