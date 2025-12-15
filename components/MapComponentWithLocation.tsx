import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Compass } from 'lucide-react';

// Fix for default Leaflet markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentWithLocationProps {
    className?: string;
    status?: 'IDLE' | 'PICKING_ORIGIN' | 'PICKING_DEST' | 'SEARCHING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
    onCenterChange?: () => void;
    currentProgress?: number;
    heading?: number;
}

const defaultCenter = {
    lat: 10.4806,
    lng: -66.9036
};

// Component to recenter map when user location changes
const MapController = ({ center }: { center: { lat: number, lng: number } }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo([center.lat, center.lng], 15);
    }, [center, map]);
    return null;
};

const MapComponentWithLocation: React.FC<MapComponentWithLocationProps> = ({
    className = '',
    status = 'IDLE',
    onCenterChange,
    currentProgress = 0
}) => {
    const [center, setCenter] = useState(defaultCenter);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationRequested, setLocationRequested] = useState(false);

    useEffect(() => {
        // Request user location on component mount
        if (!locationRequested && navigator.geolocation) {
            setLocationRequested(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(userPos);
                    setCenter(userPos);
                    console.log('✅ Ubicación obtenida:', userPos);
                },
                (error) => {
                    console.error('❌ Error obteniendo ubicación:', error);
                    console.log('Usando ubicación por defecto (Caracas)');
                }
            );
        }
    }, [locationRequested]);

    const handleRecenter = () => {
        if (userLocation) {
            setCenter(userLocation);
        }
    };

    const isPicking = status === 'PICKING_ORIGIN' || status === 'PICKING_DEST';

    return (
        <div className={`relative w-full h-full ${className} z-0`}>
            <MapContainer
                center={[center.lat, center.lng]}
                zoom={15}
                scrollWheelZoom={true}
                className="w-full h-full"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapController center={center} />

                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} />
                )}
            </MapContainer>

            {/* Picking UI Overlay */}
            {isPicking && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none flex flex-col items-center">
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

            {/* Recenter Button */}
            <div className="absolute bottom-6 right-4 z-[1000]">
                <button
                    className="bg-white p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 active:scale-95 transition-transform"
                    onClick={handleRecenter}
                    title="Recentrar Mapa"
                >
                    <Compass size={20} className="text-blue-600" />
                </button>
            </div>
        </div>
    );
};

export default MapComponentWithLocation;
