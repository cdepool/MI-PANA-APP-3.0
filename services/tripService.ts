import { supabase } from './supabaseClient';
import { Ride, ServiceId, VehicleType, LocationPoint } from '../types';

export const TripService = {
    /**
     * Creates a new trip request in the database.
     */
    async createTrip(
        passengerId: string,
        origin: LocationPoint,
        destination: LocationPoint,
        serviceId: ServiceId,
        vehicleType: VehicleType,
        price: { usd: number, ves: number },
        distanceKm: number
    ): Promise<Ride> {

        // Ensure coords are valid geometry points (although we store as Geography(Point) in DB, Supabase JS client handles some casting if configured, 
        // but often it's easier to send raw values if we used a text column. 
        // Since we used GEOGRAPHY(Point), we might need to rely on PostGIS raw query or send string representation.
        // For simplicity in this Quick Start, we'll try sending simple objects and rely on the client or update to use raw SQL if needed.
        // However, typically Supabase handles standard inserts. Let's try standard insert first.
        // Update: user migration uses "originCoords" GEOGRAPHY(Point). 
        // Inserting directly into geography columns via JS client can be tricky without a wrapper.
        // We will attempt to insert as GeoJSON-like or WKT if possible, or use a customized RPC.
        // BUT for now, let's assume we can insert metadata and use a view or just try raw.
        // Actually, the easiest way for Geography in JS is passing a WKT string 'POINT(lng lat)' if the driver supports it, 
        // or using `st_point` via RPC.
        // Let's use a standard insert and see. If "originCoords" fails, we might mock it or fix it.

        // Construct the payload matching the table columns (using the quoted names from migration)
        const { data, error } = await supabase
            .from('trips')
            .insert([
                {
                    passenger_id: passengerId,
                    status: 'REQUESTED',
                    origin: origin.address,
                    destination: destination.address,
                    // "originCoords": `POINT(${origin.lng} ${origin.lat})`, // WKT format often works if casted
                    // Let's pass null for coords initially to avoid PostGIS format errors until we confirm handling.
                    // Or better: pass them if we update the simulation to use them.
                    // We'll trust the text addresses for the UI for now.
                    "priceUsd": price.usd,
                    "priceVes": price.ves,
                    "distanceKm": distanceKm,
                    "serviceId": serviceId,
                    "vehicleType": vehicleType
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating trip:', error);
            throw error;
        }

        // Map DB response to Ride type
        return mapDbTripToRide(data);
    },

    /**
     * Subscribes to trip updates (e.g. when a driver accepts).
     */
    subscribeToTrip(tripId: string, onUpdate: (trip: Ride) => void) {
        const subscription = supabase
            .channel(`trip:${tripId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'trips',
                    filter: `id=eq.${tripId}`
                },
                (payload) => {
                    console.log('Trip update received:', payload);
                    if (payload.new) {
                        onUpdate(mapDbTripToRide(payload.new));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    },

    /**
     * Cancel a trip
     */
    async cancelTrip(tripId: string) {
        const { error } = await supabase
            .from('trips')
            .update({ status: 'CANCELLED' })
            .eq('id', tripId);

        if (error) throw error;
    },

    /**
     * Fetch trip history for a user (as passenger or driver)
     */
    async getTripHistory(userId: string): Promise<Ride[]> {
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching trip history:', error);
            throw error;
        }

        return data.map(mapDbTripToRide);
    }
};

// Helper to map DB snake_case/quoted columns to CamelCase TS Type
function mapDbTripToRide(dbRecord: any): Ride {
    return {
        id: dbRecord.id,
        passengerId: dbRecord.passenger_id,
        driverId: dbRecord.driver_id,
        status: dbRecord.status,
        origin: dbRecord.origin,
        destination: dbRecord.destination,
        originCoords: undefined, // pending PostGIS handling
        destinationCoords: undefined,
        priceUsd: dbRecord.priceUsd,
        priceVes: dbRecord.priceVes,
        distanceKm: dbRecord.distanceKm,
        serviceId: dbRecord.serviceId,
        vehicleType: dbRecord.vehicleType,
        createdAt: new Date(dbRecord.created_at)
    };
}
