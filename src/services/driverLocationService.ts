import { supabase } from './supabaseClient';
import logger from '../utils/logger';

/**
 * Driver Location Service
 * Handles real-time GPS tracking and location updates for drivers
 * Integrates with Supabase for persistence and Realtime for streaming
 */

interface LocationUpdate {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
}

interface DriverLocationState {
    watchId: number | null;
    isTracking: boolean;
    lastUpdate: Date | null;
    errorCount: number;
}

const state: DriverLocationState = {
    watchId: null,
    isTracking: false,
    lastUpdate: null,
    errorCount: 0,
};

const MAX_ERROR_COUNT = 5;
const UPDATE_INTERVAL_MS = 5000; // Minimum interval between updates
const STALE_THRESHOLD_MS = 10000; // Consider position stale after 10s

/**
 * Start continuous location tracking for driver
 * Writes position updates to driver_locations table
 */
export async function startLocationTracking(
    driverId: string,
    onError?: (error: GeolocationPositionError) => void
): Promise<boolean> {
    if (state.isTracking) {
        logger.log('[DriverLocation] Already tracking');
        return true;
    }

    if (!navigator.geolocation) {
        logger.error('[DriverLocation] Geolocation not supported');
        return false;
    }

    return new Promise((resolve) => {
        let lastUpdateTime = 0;

        state.watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const now = Date.now();

                // Throttle updates to prevent excessive writes
                if (now - lastUpdateTime < UPDATE_INTERVAL_MS) {
                    return;
                }
                lastUpdateTime = now;

                try {
                    await updateDriverLocation(driverId, {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        heading: position.coords.heading ?? undefined,
                        speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // m/s to km/h
                        accuracy: position.coords.accuracy,
                    });

                    state.lastUpdate = new Date();
                    state.errorCount = 0;

                    if (!state.isTracking) {
                        state.isTracking = true;
                        logger.log('[DriverLocation] Tracking started');
                        resolve(true);
                    }
                } catch (error) {
                    logger.error('[DriverLocation] Error updating location:', error);
                    state.errorCount++;

                    if (state.errorCount >= MAX_ERROR_COUNT) {
                        stopLocationTracking();
                    }
                }
            },
            (error) => {
                logger.error('[DriverLocation] GPS error:', error);
                state.errorCount++;
                onError?.(error);

                if (state.errorCount >= MAX_ERROR_COUNT) {
                    stopLocationTracking();
                    resolve(false);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000,
            }
        );
    });
}

/**
 * Stop location tracking
 */
export function stopLocationTracking(): void {
    if (state.watchId !== null) {
        navigator.geolocation.clearWatch(state.watchId);
        state.watchId = null;
    }
    state.isTracking = false;
    logger.log('[DriverLocation] Tracking stopped');
}

/**
 * Update driver location in database
 * Uses RPC for atomic upsert with PostGIS point
 */
export async function updateDriverLocation(
    driverId: string,
    location: LocationUpdate,
    isAvailable?: boolean
): Promise<void> {
    const { error } = await supabase.rpc('update_driver_location', {
        p_driver_id: driverId,
        p_lat: location.lat,
        p_lng: location.lng,
        p_heading: location.heading ?? null,
        p_speed_kmh: location.speed ?? null,
        p_is_available: isAvailable ?? null,
    });

    if (error) {
        throw new Error(`Failed to update driver location: ${error.message}`);
    }
}

/**
 * Set driver availability status
 */
export async function setDriverAvailability(
    driverId: string,
    isAvailable: boolean
): Promise<void> {
    const { error } = await supabase
        .from('driver_locations')
        .update({ is_available: isAvailable })
        .eq('driver_id', driverId);

    if (error) {
        // If no row exists, insert one with current position
        const position = await getCurrentPosition();
        await updateDriverLocation(driverId, position, isAvailable);
    }
}

/**
 * Get current position as promise
 */
export function getCurrentPosition(): Promise<LocationUpdate> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    heading: position.coords.heading ?? undefined,
                    speed: position.coords.speed ? position.coords.speed * 3.6 : undefined,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000,
            }
        );
    });
}

/**
 * Subscribe to driver location updates (for passenger tracking)
 * Uses Supabase Realtime with trip-scoped channel
 */
export function subscribeToDriverLocation(
    tripId: string,
    driverId: string,
    onLocationUpdate: (location: {
        lat: number;
        lng: number;
        heading: number | null;
        speed_kmh: number | null;
    }) => void
): () => void {
    const channel = supabase
        .channel(`trip_tracking:${tripId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'driver_locations',
                filter: `driver_id=eq.${driverId}`,
            },
            (payload) => {
                if (payload.new) {
                    // Parse PostGIS geography point to lat/lng
                    const location = parseGeographyPoint(payload.new.location);
                    onLocationUpdate({
                        lat: location.lat,
                        lng: location.lng,
                        heading: payload.new.heading,
                        speed_kmh: payload.new.speed_kmh,
                    });
                }
            }
        )
        .subscribe();

    // Return cleanup function
    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Parse PostGIS geography point to lat/lng
 * Handles both GeoJSON and WKT formats
 */
function parseGeographyPoint(point: unknown): { lat: number; lng: number } {
    if (!point) {
        return { lat: 0, lng: 0 };
    }

    // GeoJSON format: { type: "Point", coordinates: [lng, lat] }
    if (typeof point === 'object' && 'coordinates' in (point as object)) {
        const geojson = point as { type: string; coordinates: [number, number] };
        return {
            lng: geojson.coordinates[0],
            lat: geojson.coordinates[1],
        };
    }

    // WKT format: "POINT(-69.3451 10.0647)"
    if (typeof point === 'string') {
        const match = point.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match) {
            return {
                lng: parseFloat(match[1]),
                lat: parseFloat(match[2]),
            };
        }
    }

    logger.warn('[DriverLocation] Unknown point format:', point);
    return { lat: 0, lng: 0 };
}

/**
 * Check if tracking is currently active
 */
export function isTracking(): boolean {
    return state.isTracking;
}

/**
 * Get tracking state
 */
export function getTrackingState(): Readonly<DriverLocationState> {
    return { ...state };
}

/**
 * Check if last position is stale
 */
export function isPositionStale(): boolean {
    if (!state.lastUpdate) return true;
    return Date.now() - state.lastUpdate.getTime() > STALE_THRESHOLD_MS;
}

export default {
    startLocationTracking,
    stopLocationTracking,
    updateDriverLocation,
    setDriverAvailability,
    getCurrentPosition,
    subscribeToDriverLocation,
    isTracking,
    getTrackingState,
    isPositionStale,
};
