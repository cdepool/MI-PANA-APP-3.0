import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { MapPin, Navigation, Compass, Clock, Map as MapIcon, AlertCircle } from 'lucide-react';

interface GoogleMapComponentProps {
    className?: string;
    status?: 'IDLE' | 'PICKING_ORIGIN' | 'PICKING_DEST' | 'SEARCHING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CONFIRM_SERVICE';
    onCenterChange?: () => void;
    onCameraChange?: (center: { lat: number, lng: number }) => void;
    currentProgress?: number;
    heading?: number;
    origin?: { lat: number, lng: number };
    destination?: { lat: number, lng: number };
}

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 10.4806,
    lng: -66.9036
};

// IMPORTANT: Keep libraries array outside component to prevent LoadScript reloading
const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ['places', 'geometry', 'drawing', 'visualization'];

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
    className = '',
    status = 'IDLE',
    onCenterChange,
    onCameraChange,
    currentProgress = 0,
    origin,
    destination
}) => {
    const [center, setCenter] = useState(defaultCenter);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [distance, setDistance] = useState('');
    const [duration, setDuration] = useState('');
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const mapRef = useRef<google.maps.Map | null>(null);
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    // Initial User Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(userPos);
                    setCenter(userPos);
                },
                (error) => {
                    console.error('Error getting location:', error);
                }
            );
        }
    }, []);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
        setMap(null);
    }, []);

    const handleRecenter = () => {
        if (userLocation && map) {
            map.panTo(userLocation);
            map.setZoom(15);
        }
    };

    const handleCenterChanged = () => {
        if (map) {
            const newCenter = map.getCenter();
            if (newCenter) {
                const latLng = { lat: newCenter.lat(), lng: newCenter.lng() };
                if (onCameraChange) onCameraChange(latLng);
                if (onCenterChange) onCenterChange();
            }
        }
    };

    // Calculate Route when origin/destination change
    useEffect(() => {
        if (origin && destination && window.google) {
            const directionsService = new window.google.maps.DirectionsService();

            directionsService.route({
                origin: origin,
                destination: destination,
                travelMode: window.google.maps.TravelMode.DRIVING,
            }, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK && result) {
                    setDirectionsResponse(result);
                    // Extract info
                    const route = result.routes[0];
                    if (route && route.legs && route.legs[0]) {
                        setDistance(route.legs[0].distance?.text || '');
                        setDuration(route.legs[0].duration?.text || '');
                    }
                } else {
                    console.error('Directions request failed due to ' + status);
                }
            });
        } else {
            setDirectionsResponse(null);
            setDistance('');
            setDuration('');
        }
    }, [origin, destination]);

    const isPicking = status === 'PICKING_ORIGIN' || status === 'PICKING_DEST';

    return (
        <div className={`relative w-full h-full ${className} z-0`}>
            {/* Error State */}
            {loadError && (
                <div className="absolute inset-0 z-[1000] bg-red-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md text-center">
                        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Error de Mapa</h3>
                        <p className="text-sm text-gray-600 mb-4">{loadError}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && !loadError && (
                <div className="absolute inset-0 z-[999] bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Cargando mapa...</p>
                    </div>
                </div>
            )}

            {/* Directions Info Overlay */}
            {distance && duration && (status === 'CONFIRM_SERVICE' || status === 'IN_PROGRESS' || status === 'ACCEPTED') && (
                <div className="absolute top-24 right-4 z-[900] bg-white p-3 rounded-xl shadow-lg border border-gray-100 animate-slide-in-right">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 text-mipana-darkBlue font-bold text-sm">
                            <Clock size={14} className="text-green-600" />
                            <span>{duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                            <MapIcon size={12} />
                            <span>{distance}</span>
                        </div>
                    </div>
                </div>
            )}

            <LoadScript
                googleMapsApiKey={apiKey}
                libraries={GOOGLE_MAPS_LIBRARIES}
                onLoad={() => setIsLoading(false)}
                onError={(error) => {
                    console.error('Google Maps load error:', error);
                    setLoadError('Error al cargar Google Maps. Verifica tu conexión o API Key.');
                    setIsLoading(false);
                }}
            >
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={15}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onCenterChanged={handleCenterChanged}
                    onDragEnd={handleCenterChanged}
                    options={{
                        zoomControl: false,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        clickableIcons: false, // Cleaner look
                        styles: [
                            {
                                "featureType": "poi",
                                "elementType": "labels.text",
                                "stylers": [{ "visibility": "off" }]
                            },
                            {
                                "featureType": "transit",
                                "elementType": "labels.text",
                                "stylers": [{ "visibility": "off" }]
                            }
                        ]
                    }}
                >
                    {/* User Location Marker */}
                    {userLocation && window.google && window.google.maps && (
                        <Marker
                            position={userLocation}
                            icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 10,
                                fillColor: '#4285F4', // Google Blue
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 3,
                            }}
                            zIndex={100}
                        />
                    )}

                    {/* Picking Markers (Visual Aid when not picking centrally) */}
                    {origin && !isPicking && (
                        <Marker
                            position={origin}
                            icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                            }}
                        />
                    )}

                    {destination && !isPicking && (
                        <Marker
                            position={destination}
                            icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                            }}
                        />
                    )}

                    {/* Route Renderer */}
                    {directionsResponse && (
                        <DirectionsRenderer
                            directions={directionsResponse}
                            options={{
                                suppressMarkers: true, // We use custom markers
                                polylineOptions: {
                                    strokeColor: '#3b82f6', // Blue route
                                    strokeWeight: 5,
                                    strokeOpacity: 0.8
                                }
                            }}
                        />
                    )}
                </GoogleMap>
            </LoadScript>

            {/* Picking UI Overlay - Shows when manually picking point */}
            {isPicking && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none flex flex-col items-center pb-8">
                    <MapPin
                        className={`w-10 h-10 drop-shadow-xl ${status === 'PICKING_ORIGIN'
                            ? 'text-green-600 fill-green-600'
                            : 'text-red-600 fill-red-600'
                            }`}
                        strokeWidth={1.5}
                    />
                    <div className="absolute bottom-0 translate-y-full mt-2 bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-gray-200 whitespace-nowrap flex items-center gap-2">
                        <Navigation size={10} className="text-blue-600" />
                        {status === 'PICKING_ORIGIN' ? 'Fijar Punto de Partida' : 'Fijar Destino'}
                    </div>
                </div>
            )}

            {/* Recenter Button */}
            <div className="absolute bottom-24 right-4 z-[800]">
                <button
                    className="bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-transform"
                    onClick={handleRecenter}
                    title="Recentrar Mapa"
                >
                    <Compass size={24} className="text-blue-600" />
                </button>
            </div>
        </div>
    );
};

export default GoogleMapComponent;
