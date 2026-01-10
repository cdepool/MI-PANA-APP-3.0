import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'; // Import css

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

interface LeafletMapProps {
    className?: string;
    origin?: { lat: number, lng: number };
    destination?: { lat: number, lng: number };
    onRouteChange?: (summary: { totalDistance: number, totalTime: number }) => void;
    onCenterChange?: (lat: number, lng: number) => void;
}

const RoutingControl = ({ origin, destination, onRouteChange }: {
    origin: { lat: number, lng: number },
    destination: { lat: number, lng: number },
    onRouteChange?: (summary: { totalDistance: number, totalTime: number }) => void
}) => {
    const map = useMap();

    useEffect(() => {
        if (!origin || !destination) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(origin.lat, origin.lng),
                L.latLng(destination.lat, destination.lng)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            // @ts-ignore
            lineOptions: {
                styles: [{ color: '#6FA1EC', weight: 4 }]
            },
            // Hide the default instructions text container if you want custom UI
            // containerClassName: 'hidden-routing-container' 
        }).on('routesfound', function (e) {
            const routes = e.routes;
            const summary = routes[0].summary;
            // summary.totalDistance is in meters, summary.totalTime is in seconds
            if (onRouteChange) {
                onRouteChange({
                    totalDistance: summary.totalDistance,
                    totalTime: summary.totalTime
                });
            }
        }).addTo(map);

        return () => {
            map.removeControl(routingControl);
        };
    }, [map, origin, destination, onRouteChange]);

    return null;
};

const MapEvents = ({ onCenterChange }: { onCenterChange?: (lat: number, lng: number) => void }) => {
    const map = useMap();
    useEffect(() => {
        if (!onCenterChange) return;
        map.on('moveend', () => {
            const center = map.getCenter();
            onCenterChange(center.lat, center.lng);
        });
        return () => {
            map.off('moveend');
        };
    }, [map, onCenterChange]);
    return null;
};

const LeafletMapComponent: React.FC<LeafletMapProps> = ({ className, origin, destination, onRouteChange, onCenterChange }) => {
    // Default center (Venezuela)
    const center = origin ? [origin.lat, origin.lng] : [9.555, -69.213];

    return (
        <MapContainer
            center={center as L.LatLngExpression}
            zoom={13}
            className={className}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapEvents onCenterChange={onCenterChange} />

            {origin && (
                <Marker position={[origin.lat, origin.lng]}>
                    <Popup>Recogida</Popup>
                </Marker>
            )}
            {destination && (
                <Marker position={[destination.lat, destination.lng]}>
                    <Popup>Destino</Popup>
                </Marker>
            )}

            {origin && destination && (
                <RoutingControl origin={origin} destination={destination} onRouteChange={onRouteChange} />
            )}
        </MapContainer>
    );
};

export default LeafletMapComponent;
