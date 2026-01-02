import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

interface GoogleMapRendererProps {
    center: { lat: number; lng: number };
    origin?: { lat: number; lng: number };
    destination?: { lat: number; lng: number };
    status?: string;
    onLoad?: () => void;
    onError?: (error: string) => void;
}

// Declare Google Maps types
declare global {
    interface Window {
        google?: {
            maps: {
                Map: any;
                Marker: any;
                DirectionsService: any;
                DirectionsRenderer: any;
                LatLng: any;
                LatLngBounds: any;
                Size: any;
            };
        };
    }
}

export default function GoogleMapRenderer({
    center,
    origin,
    destination,
    status,
    onLoad,
    onError
}: GoogleMapRendererProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<any>(null);
    const directionsRenderer = useRef<any>(null);
    const directionsService = useRef<any>(null);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [scriptError, setScriptError] = useState<string | null>(null);

    // Load Google Maps Script
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            const error = 'Google Maps API key no configurada';
            setScriptError(error);
            onError?.(error);
            return;
        }

        // Check if script already loaded
        if (window.google?.maps) {
            setIsScriptLoaded(true);
            return;
        }

        // Load script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,directions`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            setIsScriptLoaded(true);
        };

        script.onerror = () => {
            const error = 'Error cargando Google Maps API';
            setScriptError(error);
            onError?.(error);
        };

        document.head.appendChild(script);

        return () => {
            // Don't remove script to avoid reloading
        };
    }, [onError]);

    // Initialize Map
    useEffect(() => {
        if (!isScriptLoaded || !mapContainer.current || !window.google?.maps) {
            return;
        }

        try {
            // Initialize map
            map.current = new window.google.maps.Map(mapContainer.current, {
                zoom: 15,
                center: center,
                mapTypeControl: false,
                fullscreenControl: false,
                streetViewControl: false,
                styles: [
                    {
                        featureType: 'all',
                        elementType: 'labels.text.fill',
                        stylers: [{ color: '#333333' }]
                    },
                    {
                        featureType: 'water',
                        elementType: 'geometry',
                        stylers: [{ color: '#e9e9e9' }]
                    }
                ]
            });

            // Initialize directions
            directionsService.current = new window.google.maps.DirectionsService();
            directionsRenderer.current = new window.google.maps.DirectionsRenderer({
                map: map.current,
                polylineOptions: {
                    strokeColor: '#0077B6',
                    strokeWeight: 4
                }
            });

            // Add user marker
            if (center) {
                new window.google.maps.Marker({
                    position: center,
                    map: map.current,
                    title: 'Tu ubicación',
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#0077B6',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2
                    }
                });
            }

            onLoad?.();
        } catch (error) {
            const errorMsg = `Error inicializando mapa: ${error}`;
            setScriptError(errorMsg);
            onError?.(errorMsg);
        }
    }, [isScriptLoaded, center, onLoad, onError]);

    // Handle route updates
    useEffect(() => {
        if (!origin || !destination || !directionsService.current || !directionsRenderer.current) {
            return;
        }

        const request = {
            origin: new window.google.maps.LatLng(origin.lat, origin.lng),
            destination: new window.google.maps.LatLng(destination.lat, destination.lng),
            travelMode: window.google.maps.TravelMode.DRIVING
        };

        directionsService.current.route(request, (result: any, status: string) => {
            if (status === 'OK') {
                directionsRenderer.current.setDirections(result);

                // Fit bounds to show both origin and destination
                const bounds = new window.google.maps.LatLngBounds();
                bounds.extend(new window.google.maps.LatLng(origin.lat, origin.lng));
                bounds.extend(new window.google.maps.LatLng(destination.lat, destination.lng));
                map.current?.fitBounds(bounds);
            } else {
                console.warn('Directions request failed:', status);
            }
        });
    }, [origin, destination]);

    if (scriptError) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg p-4">
                <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    <p className="text-sm text-red-700 text-center">{scriptError}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={mapContainer}
            className="w-full h-full rounded-lg overflow-hidden"
            style={{ minHeight: '400px' }}
        />
    );
}
