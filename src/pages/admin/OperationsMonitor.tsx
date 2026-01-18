import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import {
    Activity,
    Users,
    Navigation,
    Map as MapIcon,
    AlertTriangle,
    Clock,
    Car
} from 'lucide-react';
import { LoadingSpinner } from '../../components/admin/LoadingSpinner';
import { adminService, LiveTrip, OnlineDriver } from '../../services/adminService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const containerStyle = {
    width: '100%',
    height: 'calc(100vh - 200px)'
};

const defaultCenter = {
    lat: 10.4806,
    lng: -66.9036
};

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ['places'];

const OperationsMonitor: React.FC = () => {
    const [trips, setTrips] = useState<LiveTrip[]>([]);
    const [drivers, setDrivers] = useState<OnlineDriver[]>([]);
    const [selectedDriver, setSelectedDriver] = useState<OnlineDriver | null>(null);
    const [selectedTrip, setSelectedTrip] = useState<LiveTrip | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    useEffect(() => {
        // Initial data fetch
        const loadInitialData = async () => {
            try {
                const [initialTrips, initialDrivers] = await Promise.all([
                    adminService.getLiveTrips(),
                    adminService.getOnlineDrivers()
                ]);
                setTrips(initialTrips);
                setDrivers(initialDrivers);
            } catch (error) {
                console.error("Error loading initial operations data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();

        // Set up subscriptions
        const unsubscribeTrips = adminService.subscribeToLiveTrips(setTrips);
        const unsubscribeDrivers = adminService.subscribeToDriverLocations(setDrivers);

        return () => {
            unsubscribeTrips();
            unsubscribeDrivers();
        };
    }, []);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    if (isLoading) {
        return <LoadingSpinner message="Inicializando monitor de operaciones..." />;
    }

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-7 h-7 text-green-500" />
                        Operaciones en Vivo
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Monitoreo en tiempo real de viajes y conductores
                    </p>
                </div>
                <div className="flex gap-4">
                    <StatMini icon={<Car className="text-blue-500" />} label="Drivers" value={drivers.length} />
                    <StatMini icon={<Navigation className="text-green-500" />} label="Viajes" value={trips.length} />
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                {/* Map Panel */}
                <div className="lg:w-2/3 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 relative">
                    <LoadScript googleMapsApiKey={apiKey} libraries={GOOGLE_MAPS_LIBRARIES}>
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={defaultCenter}
                            zoom={13}
                            onLoad={onMapLoad}
                            options={{
                                styles: [
                                    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
                                ]
                            }}
                        >
                            {drivers.map(driver => (
                                <Marker
                                    key={driver.id}
                                    position={{ lat: driver.lat, lng: driver.lng }}
                                    onClick={() => setSelectedDriver(driver)}
                                    icon={{
                                        url: driver.is_available
                                            ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                                            : 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
                                    }}
                                />
                            ))}

                            {selectedDriver && (
                                <InfoWindow
                                    position={{ lat: selectedDriver.lat, lng: selectedDriver.lng }}
                                    onCloseClick={() => setSelectedDriver(null)}
                                >
                                    <div className="p-2 min-w-[150px]">
                                        <h3 className="font-bold text-gray-900">{selectedDriver.name}</h3>
                                        <p className="text-xs text-gray-600">
                                            {selectedDriver.is_available ? '🟢 Disponible' : '🟡 En viaje'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Último update: {format(new Date(selectedDriver.last_updated), 'HH:mm:ss')}
                                        </p>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    </LoadScript>
                </div>

                {/* List Panel */}
                <div className="lg:w-1/3 flex flex-col gap-6 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Navigation size={18} className="text-mipana-mediumBlue" />
                                Viajes Activos
                            </h3>
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {trips.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {trips.length > 0 ? (
                                trips.map(trip => (
                                    <div
                                        key={trip.id}
                                        className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:border-mipana-mediumBlue transition-colors cursor-pointer group"
                                        onClick={() => {
                                            setSelectedTrip(trip);
                                            // Center map on trip origin or dest if needed
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusStyle(trip.status)}`}>
                                                {trip.status}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                {format(new Date(trip.created_at), 'HH:mm')}
                                            </span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                {trip.passenger_name}
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <MapIcon size={10} className="text-mipana-mediumBlue" />
                                                <span className="truncate">{trip.origin.split(',')[0]}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                <Navigation size={10} className="text-mipana-orange" />
                                                <span className="truncate">{trip.destination.split(',')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-40">
                                    <Clock size={32} className="mb-2" />
                                    <p className="text-xs">No hay viajes activos en este momento</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatMini = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        {icon}
        <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 leading-none">{label}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white leading-none mt-1">{value}</span>
        </div>
    </div>
);

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'REQUESTED': return 'bg-yellow-100 text-yellow-800';
        case 'MATCHING': return 'bg-blue-100 text-blue-800';
        case 'ACCEPTED': return 'bg-purple-100 text-purple-800';
        case 'IN_PROGRESS': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export default OperationsMonitor;
