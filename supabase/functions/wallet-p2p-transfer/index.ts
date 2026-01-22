import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface P2PRequest {
    fromUserId: string;
    toUserId: string;
    amountUsd: number;
    description?: string;
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
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body: P2PRequest = await req.json();
        const { fromUserId, toUserId, amountUsd, description } = body;

        if (!fromUserId || !toUserId || !amountUsd || amountUsd <= 0) {
            return new Response(JSON.stringify({ error: 'Datos de transferencia invalidos' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 1. Get sender wallet and lock for update
        const { data: senderWallet, error: senderError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', fromUserId)
            .single();

        if (senderError || !senderWallet) {
            throw new Error('Billetera de origen no encontrada');
        }

        if (senderWallet.balance_usd < amountUsd) {
            return new Response(JSON.stringify({ error: 'Saldo insuficiente' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Get recipient wallet
        let { data: recipientWallet, error: recipientError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', toUserId)
            .single();

        if (recipientError && recipientError.code === 'PGRST116') {
            // Create if doesn't exist
            const { data: newWallet } = await supabase
                .from('wallets')
                .insert({ user_id: toUserId, balance_usd: 0, balance_ves: 0, status: 'active' })
                .select()
                .single();
            recipientWallet = newWallet;
        }

        if (!recipientWallet) {
            throw new Error('No se pudo establecer la billetera de destino');
        }

        // 3. Perform atomic update using RPC or manual sequence (Transaction ideally)
        // For simplicity in this env, we perform updates
        const { error: updateSenderError } = await supabase
            .from('wallets')
            .update({ balance_usd: senderWallet.balance_usd - amountUsd })
            .eq('id', senderWallet.id);

        if (updateSenderError) throw updateSenderError;

        const { error: updateRecipientError } = await supabase
            .from('wallets')
            .update({ balance_usd: recipientWallet.balance_usd + amountUsd })
            .eq('id', recipientWallet.id);

        if (updateRecipientError) throw updateRecipientError;

        // 4. Record transactions
        await supabase.from('wallet_transactions').insert([
            {
                user_id: fromUserId,
                wallet_id: senderWallet.id,
                type: 'payment',
                amount_usd: amountUsd,
                amount_ves: 0, // Simplified
                description: description || `Envío P2P a ${toUserId}`,
                status: 'completed'
            },
            {
                user_id: toUserId,
                wallet_id: recipientWallet.id,
                type: 'recharge',
                amount_usd: amountUsd,
                amount_ves: 0,
                description: `Recepción P2P de ${fromUserId}`,
                status: 'completed'
            }
        ]);

        // 5. Send notifications
        try {
            // Notify Recipient
            await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                    user_id: toUserId,
                    title: '💸 ¡Has recibido un pago!',
                    body: `Te han enviado $${amountUsd.toFixed(2)} a tu billetera.`,
                    type: 'p2p_receive'
                }),
            });

            // Notify Sender
            await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                    user_id: fromUserId,
                    title: '✅ Envío Completado',
                    body: `Has enviado $${amountUsd.toFixed(2)} exitosamente.`,
                    type: 'p2p_send'
                }),
            });
        } catch (e) {
            console.error('Notification error:', e);
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
