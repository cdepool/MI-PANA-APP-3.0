import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransactionRequest {
    userId: string
    amount: number
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'REFUND'
    description: string
    reference?: string
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get the authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        // Create a Supabase client with the Auth header
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        )

        // Verify the user is authenticated
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // Parse request body
        const { userId, amount, type, description, reference }: TransactionRequest = await req.json()

        // Verify user is performing transaction on their own account
        if (user.id !== userId) {
            throw new Error('Cannot perform transactions on other user accounts')
        }

        // Create a Supabase Admin client for privileged operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Fetch current user profile (with wallet)
        const { data: profile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (fetchError || !profile) {
            throw new Error('User profile not found')
        }

        // Calculate new balance
        let currentBalance = profile.wallet?.balance || 0
        let newBalance = currentBalance

        if (type === 'DEPOSIT' || type === 'REFUND') {
            newBalance = currentBalance + amount
        } else if (type === 'WITHDRAWAL' || type === 'PAYMENT') {
            if (currentBalance < amount) {
                throw new Error('Insufficient balance')
            }
            newBalance = currentBalance - amount
        }

        // Get BCV rate for conversion
        const bcvResponse = await fetch('https://ve.dolarapi.com/v1/dolares/oficial')
        const bcvData = await bcvResponse.json()
        const bcvRate = bcvData.promedio || bcvData.price || 46.23

        // Create transaction record
        const transaction = {
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            amount: amount,
            currency: 'USD',
            exchangeRate: bcvRate,
            date: Date.now(),
            type: type,
            description: description,
            reference: reference || undefined,
            status: 'COMPLETED'
        }

        // Update wallet with atomic transaction
        const newWallet = {
            balance: newBalance,
            transactions: [transaction, ...(profile.wallet?.transactions || [])]
        }

        const { data: updatedProfile, error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ wallet: newWallet, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single()

        if (updateError) {
            throw new Error(`Failed to update wallet: ${updateError.message}`)
        }

        // Return success response
        return new Response(
            JSON.stringify({
                success: true,
                profile: updatedProfile,
                transaction: transaction
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: error.message || 'Internal server error'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
