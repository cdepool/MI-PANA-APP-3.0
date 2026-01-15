import { supabase } from './supabaseClient';
import { Ride, ServiceId, VehicleType, LocationPoint } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const TripService = {
    /**
     * Creates a new trip request in the database and optionally triggers matching.
     */
    async createTrip(
        passengerId: string,
        origin: LocationPoint,
        destination: LocationPoint,
        serviceId: ServiceId,
        vehicleType: VehicleType,
        price: { usd: number, ves: number },
        distanceKm: number,
        autoMatch: boolean = true
    ): Promise<Ride> {
        // Build insert payload with coordinates for matching
        const insertPayload: Record<string, unknown> = {
            passenger_id: passengerId,
            status: 'REQUESTED',
            origin: origin.address,
            destination: destination.address,
            "priceUsd": price.usd,
            "priceVes": price.ves,
            "distanceKm": distanceKm,
            "serviceId": serviceId,
            "vehicleType": vehicleType
        };

        // Add coordinates if available (for PostGIS matching)
        if (origin.lat && origin.lng) {
            insertPayload.origin_lat = origin.lat;
            insertPayload.origin_lng = origin.lng;
        }
        if (destination.lat && destination.lng) {
            insertPayload.destination_lat = destination.lat;
            insertPayload.destination_lng = destination.lng;
        }

        const { data, error } = await supabase
            .from('trips')
            .insert([insertPayload])
            .select()
            .single();

        if (error) {
            console.error('Error creating trip:', error);
            throw error;
        }

        const ride = mapDbTripToRide(data);

        // Trigger matching engine asynchronously (don't wait)
        if (autoMatch) {
            this.triggerMatching(ride.id).catch(err => {
                console.error('Error triggering matching:', err);
            });
        }

        return ride;
    },

    /**
     * Trigger the matching engine Edge Function for a trip.
     * This is fire-and-forget from the frontend perspective.
     */
    async triggerMatching(tripId: string): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            console.warn('No session, skipping match trigger');
            return;
        }

        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/match-driver`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ trip_id: tripId }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Matching engine error:', error);
            } else {
                console.log('Matching engine triggered for trip:', tripId);
            }
        } catch (err) {
            console.error('Failed to call matching engine:', err);
        }
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
    },

    /**
     * Get active trip for a user (as passenger or driver)
     */
    async getActiveTrip(userId: string): Promise<Ride | null> {
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
            .in('status', ['REQUESTED', 'MATCHING', 'ACCEPTED', 'IN_PROGRESS'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching active trip:', error);
            return null;
        }

        return data ? mapDbTripToRide(data) : null;
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
