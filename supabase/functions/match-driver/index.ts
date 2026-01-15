import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchRequest {
  trip_id: string;
}

interface NearbyDriver {
  driver_id: string;
  driver_name: string;
  distance_km: number;
  heading: number | null;
  rating: number;
  vehicle_info: Record<string, unknown> | null;
}

const RADII = [1.0, 3.0, 5.0]; // km
const WAIT_TIME_MS = 15000; // 15 seconds per radius

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { trip_id }: MatchRequest = await req.json();

    if (!trip_id) {
      return new Response(
        JSON.stringify({ error: "trip_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get trip details
    const { data: trip, error: tripError } = await supabaseClient
      .from("trips")
      .select("*, passenger:profiles!passenger_id(id, name, fcm_token)")
      .eq("id", trip_id)
      .single();

    if (tripError || !trip) {
      return new Response(
        JSON.stringify({ error: "Trip not found", details: tripError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trip.status !== "REQUESTED") {
      return new Response(
        JSON.stringify({ error: "Trip is not in REQUESTED status", current_status: trip.status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Start matching process
    await supabaseClient.rpc("start_trip_matching", { p_trip_id: trip_id });

    // Get origin coordinates (parse from GEOGRAPHY point)
    // For now, we assume origin is stored or can be geocoded
    // In production, originCoords should be properly set
    const originLat = trip.origin_lat || 10.0647; // Default to Barquisimeto
    const originLng = trip.origin_lng || -69.3451;
    const vehicleType = trip.vehicleType || null;

    let matchedDriver: NearbyDriver | null = null;
    let currentRadiusIndex = 0;

    // Progressive radius expansion
    while (currentRadiusIndex < RADII.length && !matchedDriver) {
      const radius = RADII[currentRadiusIndex];

      console.log(`[Matching] Trip ${trip_id}: Searching with radius ${radius}km (attempt ${currentRadiusIndex + 1})`);

      // Find nearby drivers
      const { data: nearbyDrivers, error: driversError } = await supabaseClient
        .rpc("find_nearby_drivers", {
          p_origin_lat: originLat,
          p_origin_lng: originLng,
          p_radius_km: radius,
          p_vehicle_type: vehicleType,
          p_exclude_drivers: trip.rejected_driver_ids || [],
        });

      if (driversError) {
        console.error("[Matching] Error finding drivers:", driversError);
        currentRadiusIndex++;
        continue;
      }

      if (!nearbyDrivers || nearbyDrivers.length === 0) {
        console.log(`[Matching] No drivers found in ${radius}km radius`);
        
        // Expand radius
        await supabaseClient.rpc("expand_matching_radius", { p_trip_id: trip_id });
        currentRadiusIndex++;
        continue;
      }

      console.log(`[Matching] Found ${nearbyDrivers.length} drivers in ${radius}km radius`);

      // Notify all nearby drivers (in production, send push notifications)
      const driverIds = nearbyDrivers.map((d: NearbyDriver) => d.driver_id);
      
      await supabaseClient
        .from("trips")
        .update({ assigned_driver_ids: driverIds })
        .eq("id", trip_id);

      // TODO: Send push notifications to drivers
      // For now, drivers poll or use Realtime subscription

      // Wait for driver acceptance (polling approach)
      const startTime = Date.now();
      while (Date.now() - startTime < WAIT_TIME_MS) {
        // Check if any driver accepted
        const { data: updatedTrip } = await supabaseClient
          .from("trips")
          .select("status, driver_id, profiles!driver_id(id, name, vehicle)")
          .eq("id", trip_id)
          .single();

        if (updatedTrip?.status === "ACCEPTED" && updatedTrip?.driver_id) {
          console.log(`[Matching] Driver ${updatedTrip.driver_id} accepted trip ${trip_id}`);
          
          return new Response(
            JSON.stringify({
              success: true,
              trip_id,
              driver_id: updatedTrip.driver_id,
              driver: updatedTrip.profiles,
              radius_km: radius,
              attempt: currentRadiusIndex + 1,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (updatedTrip?.status === "CANCELLED") {
          return new Response(
            JSON.stringify({ success: false, reason: "TRIP_CANCELLED" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Wait 2 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Timeout - expand to next radius
      console.log(`[Matching] Timeout at ${radius}km radius, expanding...`);
      await supabaseClient.rpc("expand_matching_radius", { p_trip_id: trip_id });
      currentRadiusIndex++;
    }

    // No driver found after all radii
    await supabaseClient
      .from("trips")
      .update({
        status: "UNASSIGNED",
        matching_completed_at: new Date().toISOString(),
      })
      .eq("id", trip_id);

    console.log(`[Matching] No drivers found for trip ${trip_id} after all attempts`);

    return new Response(
      JSON.stringify({
        success: false,
        trip_id,
        reason: "NO_DRIVERS_AVAILABLE",
        attempts: RADII.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Matching] Unexpected error:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
