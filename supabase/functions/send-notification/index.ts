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

// FCM V1 API Configuration
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") || "landing-sketch";
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

// Token cache for OAuth2
let accessTokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth2 access token from Service Account credentials
 */
async function getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (accessTokenCache && Date.now() < accessTokenCache.expiresAt - 60000) {
        return accessTokenCache.token;
    }

    if (!FIREBASE_SERVICE_ACCOUNT) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
    }

    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);

    // Create JWT for Service Account authentication
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600, // 1 hour
        scope: "https://www.googleapis.com/auth/firebase.messaging",
    };

    // Encode JWT parts
    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    // Import private key and sign
    const privateKeyPem = serviceAccount.private_key;
    const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        pemToArrayBuffer(privateKeyPem),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signatureInput = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, signatureInput);
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
        throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
    }

    // Cache the token
    accessTokenCache = {
        token: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
    };

    return tokenData.access_token;
}

/**
 * Convert PEM to ArrayBuffer for crypto API
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, "")
        .replace(/-----END PRIVATE KEY-----/, "")
        .replace(/\n/g, "");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

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

        // Send notifications via FCM V1 API
        for (const profile of eligibleProfiles) {
            try {
                const fcmResponse = await sendFCMNotificationV1(
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
                if (fcmResponse.error?.includes("UNREGISTERED") ||
                    fcmResponse.error?.includes("INVALID_ARGUMENT")) {
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
 * Send a push notification via Firebase Cloud Messaging V1 API
 * Uses OAuth2 with Service Account for authentication
 */
async function sendFCMNotificationV1(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<{ success: boolean; message_id?: string; error?: string }> {
    if (!FIREBASE_SERVICE_ACCOUNT) {
        console.warn("FIREBASE_SERVICE_ACCOUNT not configured, using mock mode");
        return { success: true, message_id: `mock_${Date.now()}` };
    }

    try {
        // Get OAuth2 access token
        const accessToken = await getAccessToken();

        // FCM V1 API endpoint
        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

        const response = await fetch(fcmUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                message: {
                    token: token,
                    notification: {
                        title,
                        body,
                    },
                    webpush: {
                        notification: {
                            icon: "/logo-app.png",
                            badge: "/badge-icon.png",
                            requireInteraction: true,
                        },
                        fcm_options: {
                            link: "/",
                        },
                    },
                    android: {
                        priority: "high",
                        notification: {
                            icon: "ic_notification",
                            color: "#6366f1",
                            click_action: "OPEN_APP",
                        },
                    },
                    apns: {
                        payload: {
                            aps: {
                                badge: 1,
                                sound: "default",
                            },
                        },
                    },
                    data: {
                        ...data,
                        timestamp: new Date().toISOString(),
                    },
                },
            }),
        });

        if (response.ok) {
            const result = await response.json();
            // Extract message ID from the response (format: projects/*/messages/*)
            const messageId = result.name?.split("/").pop();
            return {
                success: true,
                message_id: messageId || result.name,
            };
        } else {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || JSON.stringify(errorData);
            const errorCode = errorData.error?.details?.[0]?.errorCode || "";
            return {
                success: false,
                error: `${errorCode}: ${errorMessage}`,
            };
        }
    } catch (err) {
        return {
            success: false,
            error: String(err),
        };
    }
}
