import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { MapPin, AlertCircle, Loader } from 'lucide-react';

// Lazy load Google Maps component to prevent blocking
const GoogleMapComponent = lazy(() => import('./GoogleMapRenderer'));

interface OptimizedMapComponentProps {
    className?: string;
    status?: 'IDLE' | 'PICKING_ORIGIN' | 'PICKING_DEST' | 'SEARCHING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
    origin?: { lat: number; lng: number };
    destination?: { lat: number; lng: number };
    onLocationChange?: (location: { lat: number; lng: number }) => void;
}

const defaultCenter = {
    lat: 10.4806,
    lng: -66.9036
};

export default function OptimizedMapComponent({
    className = '',
    status = 'IDLE',
    origin,
    destination,
    onLocationChange
}: OptimizedMapComponentProps) {
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    const [isLoadingMap, setIsLoadingMap] = useState(true);

    // Get user location with timeout
    useEffect(() => {
        const locationTimeout = setTimeout(() => {
            if (!userLocation) {
                setUserLocation(defaultCenter);
                setIsLoadingMap(false);
            }
        }, 5000);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(userPos);
                    onLocationChange?.(userPos);
                    setIsLoadingMap(false);
                    clearTimeout(locationTimeout);
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    setUserLocation(defaultCenter);
                    setIsLoadingMap(false);
                    clearTimeout(locationTimeout);
                }
            );
        } else {
            setUserLocation(defaultCenter);
            setIsLoadingMap(false);
            clearTimeout(locationTimeout);
        }

        return () => clearTimeout(locationTimeout);
    }, []);

    const handleMapLoad = useCallback(() => {
        setIsMapLoaded(true);
    }, []);

    const handleMapError = useCallback((error: string) => {
        setMapError(error);
        console.error('Map error:', error);
    }, []);

    // Loading state
    if (isLoadingMap) {
        return (
            <div className={`${className} bg-gray-100 flex items-center justify-center`}>
                <div className="flex flex-col items-center gap-3">
                    <Loader className="w-8 h-8 text-mipana-cyan animate-spin" />
                    <p className="text-sm text-gray-600">Cargando ubicación...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (mapError) {
        return (
            <div className={`${className} bg-red-50 border border-red-200 rounded-lg flex items-center justify-center p-6`}>
                <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <p className="text-sm text-red-700 text-center">{mapError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${className} relative bg-gray-50 rounded-lg overflow-hidden`}>
            <Suspense
                fallback={
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="flex flex-col items-center gap-2">
                            <Loader className="w-6 h-6 text-mipana-cyan animate-spin" />
                            <p className="text-xs text-gray-600">Inicializando mapa...</p>
                        </div>
                    </div>
                }
            >
                <GoogleMapComponent
                    center={userLocation || defaultCenter}
                    origin={origin}
                    destination={destination}
                    status={status}
                    onLoad={handleMapLoad}
                    onError={handleMapError}
                />
            </Suspense>
        </div>
    );
}
