import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Compass } from 'lucide-react';

// Fix for default Leaflet markers in React/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
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

// Component to handle map events and center tracking
const MapEvents = ({ onCenterChange, onMove }: { onCenterChange?: () => void, onMove?: (center: L.LatLng) => void }) => {
    const map = useMapEvents({
        moveend: () => {
            if (onCenterChange) onCenterChange();
        },
        move: () => {
            if (onMove) onMove(map.getCenter());
        }
    });
    return null;
};

// Component to programmatically move map
const MapController = ({ center, zoom }: { center: { lat: number, lng: number }, zoom?: number }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo([center.lat, center.lng], zoom || map.getZoom());
    }, [center, zoom, map]);
    return null;
};

const MapComponent: React.FC<MapComponentProps> = ({
    className = '',
    status = 'IDLE',
    onCenterChange,
    currentProgress = 0
}) => {
    const [center, setCenter] = useState(defaultCenter);
    const [zoom, setZoom] = useState(15);
    const [markerPosition, setMarkerPosition] = useState(defaultCenter);

    // Origin and Destination refs (simulated for now, would likely come from props in a real refactor but keeping internal state to match previous component signature)
    const originRef = useRef<{ lat: number, lng: number } | null>(null);
    const destRef = useRef<{ lat: number, lng: number } | null>(null);

    const isPicking = status === 'PICKING_ORIGIN' || status === 'PICKING_DEST';
    const isRoutePreview = status === 'SEARCHING' || status === 'ACCEPTED' || status === 'IN_PROGRESS' || status === 'COMPLETED';

    // Handle confirming location based on status changes (simplified logic simulation)
    // The parent component controls "step", but this component was handling some internal logic.
    // In the previous component, handleConfirmLocation was called internally or via refs.
    // Here we will just track the center.

    // Sync origin/dest based on status transitions (a bit hacky to match previous behavior purely on props)
    useEffect(() => {
        if (status === 'PICKING_ORIGIN') {
            // preparing to pick
        }
    }, [status]);

    const handleConfirm = () => {
        if (status === 'PICKING_ORIGIN') {
            originRef.current = markerPosition;
        } else if (status === 'PICKING_DEST') {
            destRef.current = markerPosition;
        }
    };

    // We can expose the handleConfirm via ref if needed, but for now we rely on the parent getting the address.
    // The previous component had logic to set originRef/destRef but didn't seem to expose them back up directly except via side effects or standard flow?
    // Actually PassengerHome uses `handleMapCenterChange` which simulates geocoding the CENTER. 
    // So the parent doesn't need to know about internal refs, check PassengerHome line 125: `simulateReverseGeocoding`.
    // It mocks parsing the address.

    const handleRecenter = () => {
        setCenter(defaultCenter);
        setZoom(15);
    };

    return (
        <div className={`relative w-full h-full ${className} z-0`}>
            <MapContainer
                center={[defaultCenter.lat, defaultCenter.lng]}
                zoom={15}
                scrollWheelZoom={true}
                className="w-full h-full"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEvents
                    onCenterChange={onCenterChange}
                    onMove={(newCenter) => setMarkerPosition({ lat: newCenter.lat, lng: newCenter.lng })}
                />

                <MapController center={center} zoom={zoom} />

                {/* Markers for Origin/Destination if set */}
                {/* Note: In the previous component, originRef was internal state. 
                    If we want to show markers for confirmed locations, we'd need that state. 
                    Since we simplified, we might rely on the map center for 'Picking'. 
                */}

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

            {/* Attribution overlay if needed or standard Leaflet logic */}
        </div>
    );
};

export default MapComponent;
