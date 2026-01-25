// Supabase Edge Function: Bancamiga Health Dashboard
// Endpoint: /functions/v1/bancamiga-dashboard
// Proporciona información de salud y estado de la integración con Bancamiga

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    try {
        const dashboard = {
            timestamp: new Date().toISOString(),
            service: "Bancamiga Integration",
            status: "operational",
            checks: {},
            metrics: {},
        };

        // 1. Check Token Expiration
        const tokenExpires = Deno.env.get("BANCAMIGA_TOKEN_EXPIRES");
        if (tokenExpires) {
            const expiresTimestamp = parseInt(tokenExpires, 10);
            const now = Math.floor(Date.now() / 1000);
            const daysUntilExpiration = Math.floor((expiresTimestamp - now) / (24 * 60 * 60));

            dashboard.checks.token_expiration = {
                status: daysUntilExpiration < 0 ? "critical" : daysUntilExpiration <= 7 ? "warning" : "ok",
                days_remaining: daysUntilExpiration,
                expires_at: new Date(expiresTimestamp * 1000).toISOString(),
            };

            if (daysUntilExpiration < 0) {
                dashboard.status = "degraded";
            }
        } else {
            dashboard.checks.token_expiration = {
                status: "error",
                message: "BANCAMIGA_TOKEN_EXPIRES not configured",
            };
            dashboard.status = "degraded";
        }

        // 2. Check Bancamiga API Connectivity
        const bancamigaHost = Deno.env.get("BANCAMIGA_HOST") || "https://adminp2p.sitca-ve.com";

        try {
            const healthCheck = await fetch(`${bancamigaHost}/healthcheck`, {
                signal: AbortSignal.timeout(5000),
            });

            const healthData = await healthCheck.json();

            dashboard.checks.api_connectivity = {
                status: healthCheck.ok ? "ok" : "error",
                response_time_ms: 0, // TODO: measure actual response time
                last_check: healthData.time || new Date().toISOString(),
            };
        } catch (error) {
            dashboard.checks.api_connectivity = {
                status: "error",
                message: error.message,
            };
            dashboard.status = "degraded";
        }

        // 3. Check Configuration
        const requiredEnvVars = [
            "BANCAMIGA_HOST",
            "BANCAMIGA_DNI",
            "BANCAMIGA_ACCESS_TOKEN",
            "BANCAMIGA_REFRESH_TOKEN",
            "BANCAMIGA_TOKEN_EXPIRES",
        ];

        const missingVars = requiredEnvVars.filter(varName => !Deno.env.get(varName));

        dashboard.checks.configuration = {
            status: missingVars.length === 0 ? "ok" : "warning",
            missing_variables: missingVars,
            optional_configured: {
                password: !!Deno.env.get("BANCAMIGA_PASSWORD"),
                webhook_secret: !!Deno.env.get("BANCAMIGA_WEBHOOK_SECRET"),
            },
        };

        // 4. Recent Transaction Metrics
        const { data: recentTransactions, error: txError } = await supabase
            .from("bank_transactions")
            .select("id, created_at, amount, status")
            .order("created_at", { ascending: false })
            .limit(10);

        if (!txError && recentTransactions) {
            const last24h = recentTransactions.filter(tx => {
                const txDate = new Date(tx.created_at);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return txDate > dayAgo;
            });

            dashboard.metrics.transactions_24h = last24h.length;
            dashboard.metrics.last_transaction = recentTransactions[0]?.created_at || null;
        }

        // 5. Webhook Status
        const { data: webhookLogs } = await supabase
            .from("webhook_logs")
            .select("status")
            .eq("endpoint", "bancamiga")
            .order("created_at", { ascending: false })
            .limit(100);

        if (webhookLogs && webhookLogs.length > 0) {
            const successful = webhookLogs.filter(log => log.status === "processed").length;
            const failed = webhookLogs.filter(log => log.status === "failed").length;

            dashboard.metrics.webhook = {
                total_recent: webhookLogs.length,
                successful,
                failed,
                success_rate: ((successful / webhookLogs.length) * 100).toFixed(2) + "%",
            };

            dashboard.checks.webhook = {
                status: failed === 0 ? "ok" : failed < successful ? "warning" : "error",
            };
        } else {
            dashboard.checks.webhook = {
                status: "unknown",
                message: "No webhook activity recorded",
            };
        }

        // Determine overall status
        const statuses = Object.values(dashboard.checks).map(check => check.status);
        if (statuses.includes("critical") || statuses.includes("error")) {
            dashboard.status = "degraded";
        } else if (statuses.includes("warning")) {
            dashboard.status = "operational_with_warnings";
        }

        return new Response(
            JSON.stringify(dashboard, null, 2),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error generating dashboard:", error);

        return new Response(
            JSON.stringify({
                error: error.message,
                status: "error",
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
