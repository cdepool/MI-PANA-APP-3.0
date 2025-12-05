import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, TrafficLayer } from '@react-google-maps/api';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface GoogleMapComponentProps {
    className?: string;
    status?: 'IDLE' | 'PICKING_ORIGIN' | 'PICKING_DEST' | 'SEARCHING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
    onCenterChange?: () => void;
    currentProgress?: number;
    heading?: number;
}

// Default center: Caracas, Venezuela
const defaultCenter = {
    lat: 10.4806,
    lng: -66.9036
};

const containerStyle = {
    width: '100%',
    height: '100%'
};

// Google Maps options - Estilo Estándar
const mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap', // Estándar
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    styles: [] // Sin estilos custom, usar el estándar de Google
};

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
    className = '',
    status = 'IDLE',
    onCenterChange,
    currentProgress = 0
}) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSy8k70qph0XpgfSBEWAfQiTgEsslgQwE' // ✅ Usar env var con fallback
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const [markerPosition, setMarkerPosition] = useState(defaultCenter);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

    // Refs para origen y destino
    const originRef = useRef<google.maps.LatLng | null>(null);
    const destRef = useRef<google.maps.LatLng | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    // Actualizar posición del marcador cuando se mueve el mapa (modo picking)
    useEffect(() => {
        if (!map) return;

        const isPicking = status === 'PICKING_ORIGIN' || status === 'PICKING_DEST';

        if (isPicking) {
            const listener = map.addListener('center_changed', () => {
                const newCenter = map.getCenter();
                if (newCenter) {
                    setMarkerPosition({
                        lat: newCenter.lat(),
                        lng: newCenter.lng()
                    });
                }
            });

            return () => {
                google.maps.event.removeListener(listener);
            };
        }
    }, [map, status]);

    // Llamar onCenterChange cuando se suelta el mapa
    useEffect(() => {
        if (!map) return;

        const listener = map.addListener('idle', () => {
            if (onCenterChange) {
                onCenterChange();
            }
        });

        return () => {
            google.maps.event.removeListener(listener);
        };
    }, [map, onCenterChange]);

    // Calcular ruta cuando hay origen y destino
    useEffect(() => {
        if (!map || !originRef.current || !destRef.current) return;

        const directionsService = new google.maps.DirectionsService();

        directionsService.route(
            {
                origin: originRef.current,
                destination: destRef.current,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    setDirections(result);
                }
            }
        );
    }, [map, status]);

    // Guardar posición cuando se confirma
    const handleConfirmLocation = () => {
        if (status === 'PICKING_ORIGIN') {
            originRef.current = new google.maps.LatLng(markerPosition.lat, markerPosition.lng);
        } else if (status === 'PICKING_DEST') {
            destRef.current = new google.maps.LatLng(markerPosition.lat, markerPosition.lng);
        }
    };

    const handleRecenter = () => {
        if (map) {
            map.panTo(defaultCenter);
            map.setZoom(14);
        }
    };

    if (loadError) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
                <div className="text-center p-8">
                    <p className="text-red-600 font-bold mb-2">Error al cargar Google Maps</p>
                    <p className="text-sm text-gray-600">
                        Verifica tu API Key en GoogleMapComponent.tsx
                    </p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Cargando mapa...</p>
                </div>
            </div>
        );
    }

    const isPicking = status === 'PICKING_ORIGIN' || status === 'PICKING_DEST';
    const isRoutePreview = status === 'SEARCHING' || status === 'ACCEPTED' || status === 'IN_PROGRESS' || status === 'COMPLETED';

    return (
        <div className={`relative w-full h-full ${className}`}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={mapOptions}
            >
                {/* CAPA DE TRÁFICO - Siempre activa */}
                <TrafficLayer />

                {/* Marcador central cuando se está seleccionando ubicación */}
                {isPicking && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-30 pointer-events-none flex flex-col items-center">
                        <MapPin
                            className={`w-10 h-10 drop-shadow-lg ${status === 'PICKING_ORIGIN'
                                ? 'text-green-600 fill-green-600'
                                : 'text-red-600 fill-red-600'
                                }`}
                            strokeWidth={1.5}
                        />
                        <div className="mt-2 bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-gray-200 whitespace-nowrap flex items-center gap-2">
                            <Navigation size={10} className="text-blue-600" />
                            {status === 'PICKING_ORIGIN' ? 'Fijar Punto de Partida' : 'Fijar Destino'}
                        </div>
                    </div>
                )}

                {/* Marcador de Origen */}
                {originRef.current && (
                    <Marker
                        position={originRef.current}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#22c55e',
                            fillOpacity: 1,
                            strokeWeight: 3,
                            strokeColor: '#ffffff'
                        }}
                    />
                )}

                {/* Marcador de Destino */}
                {destRef.current && (
                    <Marker
                        position={destRef.current}
                        icon={{
                            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                        }}
                    />
                )}

                {/* Ruta con direcciones */}
                {isRoutePreview && directions && (
                    <DirectionsRenderer
                        directions={directions}
                        options={{
                            polylineOptions: {
                                strokeColor: '#4285F4',
                                strokeWeight: 5,
                                strokeOpacity: 0.8
                            },
                            suppressMarkers: true
                        }}
                    />
                )}
            </GoogleMap>

            {/* Botón de recentrar */}
            <div className="absolute bottom-6 right-4 z-30">
                <button
                    className="bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-transform"
                    onClick={handleRecenter}
                    title="Recentrar Mapa"
                >
                    <Compass size={20} className="text-blue-600" />
                </button>
            </div>

            {/* Logo de Google Maps */}
            <div className="absolute bottom-2 left-2 pointer-events-none select-none z-20">
                <img
                    src="https://maps.gstatic.com/mapfiles/api-3/images/google_white5.png"
                    alt="Google"
                    className="h-6 opacity-90"
                />
            </div>
        </div>
    );
};

export default GoogleMapComponent;
