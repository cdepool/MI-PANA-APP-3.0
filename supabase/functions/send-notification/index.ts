import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
    user_id?: string;
    user_ids?: string[];
    title: string;
    body: string;
    type: string;
    data?: Record<string, string>;
}

const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY");

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            {
                auth: { autoRefreshToken: false, persistSession: false },
            }
        );

        const request: NotificationRequest = await req.json();
        const { user_id, user_ids, title, body, type, data } = request;

        // Determine target users
        const targetUserIds = user_ids || (user_id ? [user_id] : []);

        if (targetUserIds.length === 0) {
            return new Response(
                JSON.stringify({ error: "user_id or user_ids is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get FCM tokens for target users
        const { data: profiles, error: profilesError } = await supabaseClient
            .from("profiles")
            .select("id, fcm_token, notification_preferences")
            .in("id", targetUserIds)
            .not("fcm_token", "is", null);

        if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            throw profilesError;
        }

        if (!profiles || profiles.length === 0) {
            console.log("No FCM tokens found for target users");
            return new Response(
                JSON.stringify({ success: true, sent: 0, reason: "no_tokens" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Filter by notification preferences
        const eligibleProfiles = profiles.filter((p) => {
            const prefs = p.notification_preferences || {};
            // Check if this notification type is enabled
            if (type === "promotion" && prefs.promotions === false) return false;
            if (type === "trip_update" && prefs.trip_updates === false) return false;
            return true;
        });

        const results: { user_id: string; success: boolean; error?: string }[] = [];

        // Send notifications via FCM
        for (const profile of eligibleProfiles) {
            try {
                const fcmResponse = await sendFCMNotification(
                    profile.fcm_token,
                    title,
                    body,
                    data
                );

                // Log the notification
                await supabaseClient.from("notification_logs").insert({
                    user_id: profile.id,
                    type,
                    title,
                    body,
                    data,
                    status: fcmResponse.success ? "sent" : "failed",
                    fcm_message_id: fcmResponse.message_id,
                    error_message: fcmResponse.error,
                    sent_at: new Date().toISOString(),
                });

                results.push({
                    user_id: profile.id,
                    success: fcmResponse.success,
                    error: fcmResponse.error,
                });

                // If token is invalid, remove it
                if (fcmResponse.error?.includes("InvalidRegistration") ||
                    fcmResponse.error?.includes("NotRegistered")) {
                    await supabaseClient
                        .from("profiles")
                        .update({ fcm_token: null })
                        .eq("id", profile.id);
                }
            } catch (err) {
                console.error(`Error sending to ${profile.id}:`, err);
                results.push({
                    user_id: profile.id,
                    success: false,
                    error: String(err),
                });
            }
        }

        const successCount = results.filter((r) => r.success).length;

        return new Response(
            JSON.stringify({
                success: true,
                sent: successCount,
                total: eligibleProfiles.length,
                results,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Notification error:", error);
        return new Response(
            JSON.stringify({ error: String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

/**
 * Send a push notification via Firebase Cloud Messaging
 */
async function sendFCMNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<{ success: boolean; message_id?: string; error?: string }> {
    if (!FCM_SERVER_KEY) {
        console.warn("FCM_SERVER_KEY not configured, using mock mode");
        return { success: true, message_id: `mock_${Date.now()}` };
    }

    try {
        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `key=${FCM_SERVER_KEY}`,
            },
            body: JSON.stringify({
                to: token,
                notification: {
                    title,
                    body,
                    icon: "/logo-app.png",
                    click_action: "OPEN_APP",
                },
                data: {
                    ...data,
                    timestamp: new Date().toISOString(),
                },
                priority: "high",
                time_to_live: 86400, // 24 hours
            }),
        });

        const result = await response.json();

        if (result.success === 1) {
            return {
                success: true,
                message_id: result.results?.[0]?.message_id,
            };
        } else {
            return {
                success: false,
                error: result.results?.[0]?.error || "Unknown FCM error",
            };
        }
    } catch (err) {
        return {
            success: false,
            error: String(err),
        };
    }
}
