// Supabase Edge Function: BANCAMIGA Webhook (Hardened)
// Endpoint: /functions/v1/bancamiga-webhook
// Recibe notificaciones automáticas de pagos móvil con seguridad mejorada

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bancamiga-signature, x-webhook-timestamp",
};

// Environment variables
const WEBHOOK_SECRET = Deno.env.get("BANCAMIGA_WEBHOOK_SECRET");
const WEBHOOK_AUTH_TOKEN = Deno.env.get("WEBHOOK_AUTH_TOKEN");

Deno.serve(async (req) => {
    const startTime = Date.now();

    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get request details for logging
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const bodyText = await req.text();
    let paymentData: any;

    try {
        paymentData = JSON.parse(bodyText);
    } catch {
        return new Response(
            JSON.stringify({ Code: 400, error: "Invalid JSON" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // ========================================
    // 1. SIGNATURE VALIDATION
    // ========================================
    const signature = req.headers.get("x-bancamiga-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");
    const authHeader = req.headers.get("Authorization");

    let signatureValid = false;

    // Method 1: HMAC signature validation (preferred)
    if (signature && WEBHOOK_SECRET) {
        const expectedSignature = await generateHMAC(bodyText, WEBHOOK_SECRET);
        signatureValid = signature === expectedSignature;

        // Also check timestamp to prevent replay attacks (5 minute window)
        if (timestamp) {
            const webhookTime = parseInt(timestamp, 10);
            const now = Date.now();
            if (Math.abs(now - webhookTime) > 5 * 60 * 1000) {
                console.warn("⚠️ Webhook timestamp outside acceptable window");
                signatureValid = false;
            }
        }
    }
    // Method 2: Bearer token validation (fallback for legacy)
    else if (authHeader && WEBHOOK_AUTH_TOKEN) {
        signatureValid = authHeader === `Bearer ${WEBHOOK_AUTH_TOKEN}`;
    }

    // Log the webhook attempt
    const webhookLog = await logWebhook(supabaseClient, {
        endpoint: "bancamiga",
        method: req.method,
        headers: Object.fromEntries(req.headers.entries()),
        body: paymentData,
        ip_address: clientIP,
        signature_valid: signatureValid,
        signature_received: signature || authHeader || null,
    });

    if (!signatureValid) {
        console.warn("❌ Webhook authentication failed");
        await updateWebhookLog(supabaseClient, webhookLog.id, {
            status: "invalid",
            response_code: 401,
            processing_time_ms: Date.now() - startTime,
        });

        return new Response(
            JSON.stringify({ Code: 401, error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // ========================================
    // 2. IDEMPOTENCY CHECK
    // ========================================
    const idempotencyKey = paymentData.NroReferencia || paymentData.Refpk;

    const { data: idempotencyCheck } = await supabaseClient.rpc("check_idempotency", {
        p_key: idempotencyKey,
        p_endpoint: "bancamiga",
    });

    if (idempotencyCheck?.[0]?.already_processed) {
        console.log("⚡ Duplicate webhook detected, returning cached response");
        await updateWebhookLog(supabaseClient, webhookLog.id, {
            status: "duplicate",
            response_code: 200,
            processing_time_ms: Date.now() - startTime,
        });

        return new Response(
            JSON.stringify(idempotencyCheck[0].cached_response || { Code: 200, Refpk: paymentData.Refpk }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const idempotencyId = idempotencyCheck?.[0]?.idempotency_id;

    try {
        console.log("📲 WEBHOOK RECIBIDO:", {
            amount: paymentData.Amount,
            reference: paymentData.NroReferencia,
            phone: paymentData.PhoneOrig,
            bank: paymentData.BancoOrig,
            date: paymentData.FechaMovimiento,
        });

        // ========================================
        // 3. SAVE TRANSACTION
        // ========================================
        const { data: transaction, error: insertError } = await supabaseClient
            .from("bank_transactions")
            .insert({
                reference: paymentData.NroReferencia,
                refpk: paymentData.Refpk,
                phone_orig: paymentData.PhoneOrig,
                phone_dest: paymentData.PhoneDest,
                amount: parseFloat(paymentData.Amount),
                bank_orig: paymentData.BancoOrig,
                transaction_date: `${paymentData.FechaMovimiento}T${paymentData.HoraMovimiento}`,
                status: "received",
                signature_verified: signatureValid,
                raw_data: paymentData,
            })
            .select()
            .single();

        if (insertError && insertError.code !== "23505") {
            console.error("❌ Error guardando pago:", insertError);
            throw insertError;
        }

        console.log("✅ Pago registrado:", transaction?.id || "Ya existía");

        // ========================================
        // 4. AUTOMATIC MATCHING
        // ========================================
        if (transaction || insertError?.code === "23505") {
            const refForMatch = paymentData.NroReferencia.slice(-4);
            const amountForMatch = parseFloat(paymentData.Amount);
            const phoneForMatch = paymentData.PhoneOrig.replace(/\D/g, "").slice(-10);

            console.log(`🔎 Buscando coincidencia para: Tel ${phoneForMatch}, Monto ${amountForMatch}, Ref ${refForMatch}`);

            // Find pending recharge request
            const { data: rechargeRequest } = await supabaseClient
                .from("recharge_requests")
                .select("*, user:profiles!user_id(id, name, fcm_token)")
                .eq("status", "pending")
                .eq("last_four_digits", refForMatch)
                .eq("amount_ves", amountForMatch)
                .filter("bank_orig", "eq", paymentData.BancoOrig)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (rechargeRequest) {
                console.log("🎯 Coincidencia encontrada! Procesando recarga...", rechargeRequest.id);

                // Get transaction ID if it was a duplicate
                let transactionId = transaction?.id;
                if (!transactionId) {
                    const { data: existingTx } = await supabaseClient
                        .from("bank_transactions")
                        .select("id")
                        .eq("reference", paymentData.NroReferencia)
                        .single();
                    transactionId = existingTx?.id;
                }

                // Process recharge
                const { error: processError } = await supabaseClient.rpc("process_recharge", {
                    p_recharge_request_id: rechargeRequest.id,
                    p_bank_transaction_id: transactionId,
                });

                if (processError) {
                    console.error("❌ Error al procesar recarga:", processError);
                } else {
                    console.log("🎉 Recarga procesada exitosamente!");

                    // Update reconciliation status
                    await supabaseClient
                        .from("bank_transactions")
                        .update({
                            status: "verified",
                            reconciliation_status: "matched",
                            reconciled_at: new Date().toISOString(),
                        })
                        .eq("id", transactionId);

                    // Send push notification to user
                    if (rechargeRequest.user?.fcm_token) {
                        await sendNotification(supabaseClient, rechargeRequest.user.id, {
                            title: "💰 Recarga Exitosa",
                            body: `Se han acreditado Bs. ${amountForMatch.toLocaleString()} a tu billetera`,
                            type: "payment_confirmed",
                        });
                    }
                }
            } else {
                console.log("ℹ️ No se encontró una solicitud de recarga pendiente que coincida.");

                // Mark transaction as unmatched for manual review
                if (transaction?.id) {
                    await supabaseClient
                        .from("bank_transactions")
                        .update({ reconciliation_status: "unmatched" })
                        .eq("id", transaction.id);
                }
            }
        }

        // ========================================
        // 5. COMPLETE IDEMPOTENCY
        // ========================================
        const response = { Code: 200, Refpk: paymentData.Refpk };

        if (idempotencyId) {
            await supabaseClient.rpc("complete_idempotency", {
                p_idempotency_id: idempotencyId,
                p_status: "completed",
                p_response: response,
            });
        }

        await updateWebhookLog(supabaseClient, webhookLog.id, {
            status: "processed",
            response_code: 200,
            processing_time_ms: Date.now() - startTime,
        });

        return new Response(
            JSON.stringify(response),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("❌ Error procesando webhook:", error.message);

        if (idempotencyId) {
            await supabaseClient.rpc("complete_idempotency", {
                p_idempotency_id: idempotencyId,
                p_status: "failed",
                p_response: { error: error.message },
            });
        }

        await updateWebhookLog(supabaseClient, webhookLog.id, {
            status: "failed",
            response_code: 500,
            error_message: error.message,
            processing_time_ms: Date.now() - startTime,
        });

        return new Response(
            JSON.stringify({ Code: 500, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

async function generateHMAC(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

async function logWebhook(
    client: ReturnType<typeof createClient>,
    data: Record<string, unknown>
): Promise<{ id: string }> {
    const { data: log } = await client
        .from("webhook_logs")
        .insert(data)
        .select("id")
        .single();
    return log || { id: "unknown" };
}

async function updateWebhookLog(
    client: ReturnType<typeof createClient>,
    id: string,
    data: Record<string, unknown>
): Promise<void> {
    await client
        .from("webhook_logs")
        .update({ ...data, processed_at: new Date().toISOString() })
        .eq("id", id);
}

async function sendNotification(
    client: ReturnType<typeof createClient>,
    userId: string,
    notification: { title: string; body: string; type: string }
): Promise<void> {
    try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
                user_id: userId,
                ...notification,
            }),
        });
    } catch (err) {
        console.error("Failed to send notification:", err);
    }
}
