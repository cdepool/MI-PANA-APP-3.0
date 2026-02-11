import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Search, ChevronRight, Car, Bike, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedMapComponent from '../../components/UnifiedMapComponent';
import { ConnectionStatusChip } from '../../components/shared/ConnectionStatusChip';
import { DestinationSearchInput } from '../../components/traslados/DestinationSearchInput';
import { useAuth } from '../../context/AuthContext';

const SERVICES = [
    { id: 'car', name: 'Mi Pana Carro', price: 5.50, description: 'Cómodo y seguro', icon: <Car size={24} /> },
    { id: 'moto', name: 'Mi Pana Moto', price: 3.00, description: 'Rápido y económico', icon: <Bike size={24} /> }
];

export default function RequestRide() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<'DESTINATION' | 'SERVICE'>('DESTINATION');
    const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [selectedService, setSelectedService] = useState(SERVICES[0]);
    const [routeInfo, setRouteInfo] = useState<any>(null);

    // Get current location on mount if possible
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setOriginCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }, []);

    const handleSelectDest = (place: any) => {
        // En un entorno real, usarías Geocoding para obtener coords del place_id
        // Para el demo, simulamos coordenadas cercanas
        setDestCoords({
            lat: (originCoords?.lat || 10.4806) + 0.02,
            lng: (originCoords?.lng || -66.9036) + 0.02
        });
        setStep('SERVICE');
    };

    const handleConfirmRide = () => {
        if (!destCoords) return;

        // Navegar a Billetera con el contexto del viaje
        navigate('/billetera', {
            state: {
                type: 'PAGO_VIAJE',
                amount: selectedService.price,
                serviceName: selectedService.name,
                destination: 'Destino Seleccionado' // En real usaríamos el address
            }
        });
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col relative overflow-hidden">
            <ConnectionStatusChip />

            {/* Map (Full Height Background) */}
            <div className="absolute inset-0 z-0">
                <UnifiedMapComponent
                    status={step === 'SERVICE' ? 'CONFIRM_SERVICE' : 'PICKING_DEST'}
                    origin={originCoords}
                    destination={destCoords}
                    onRouteCalculated={setRouteInfo}
                />
            </div>

            {/* Floating Header */}
            <header className="relative z-10 px-4 pt-6 flex items-center gap-3 pointer-events-none">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 pointer-events-auto active:scale-95 transition-all"
                >
                    <ArrowLeft size={20} className="text-mipana-darkBlue" />
                </button>
                <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/20 flex-1 pointer-events-auto">
                    <p className="text-[10px] font-black text-mipana-orange uppercase tracking-widest leading-none mb-1">Pedir un Pana</p>
                    <h1 className="text-sm font-black text-mipana-darkBlue tracking-tight">Selecciona tu destino</h1>
                </div>
            </header>

            {/* Bottom Controls */}
            <div className="mt-auto relative z-10 p-4 w-full max-w-lg mx-auto pointer-events-none">
                <AnimatePresence mode="wait">
                    {step === 'DESTINATION' ? (
                        <motion.div
                            key="dest"
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="bg-white/95 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white/20 pointer-events-auto"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <p className="text-xs font-bold text-blue-900 line-clamp-1">Ubicación actual detectada</p>
                                </div>
                                <div className="relative">
                                    <DestinationSearchInput
                                        onSelect={handleSelectDest}
                                        placeholder="¿A dónde vamos, mi pana?"
                                    />
                                </div>
                                <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest py-2">O selecciona en el mapa</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="service"
                            initial={{ y: 200, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 200, opacity: 0 }}
                            className="bg-white/95 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white/20 pointer-events-auto space-y-6"
                        >
                            <div className="flex items-center justify-between pb-2">
                                <button onClick={() => setStep('DESTINATION')} className="text-xs font-black text-mipana-orange uppercase tracking-widest flex items-center gap-1">
                                    <ArrowLeft size={12} /> Cambiar Destino
                                </button>
                                {routeInfo && (
                                    <span className="text-xs font-black text-gray-400">{routeInfo.distanceText} • {routeInfo.durationText}</span>
                                )}
                            </div>

                            <div className="space-y-3">
                                {SERVICES.map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => setSelectedService(service)}
                                        className={`w-full p-4 rounded-3xl flex items-center justify-between border-2 transition-all ${selectedService.id === service.id
                                                ? 'border-mipana-darkBlue bg-blue-50/50'
                                                : 'border-transparent bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${selectedService.id === service.id ? 'bg-mipana-darkBlue text-white' : 'bg-white text-gray-400'
                                                }`}>
                                                {service.icon}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-sm text-mipana-darkBlue">{service.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{service.description}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg text-mipana-darkBlue">${service.price.toFixed(2)}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleConfirmRide}
                                className="w-full py-5 bg-mipana-darkBlue hover:bg-black text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                            >
                                Confirmar y Pagar
                                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <div className="flex items-start gap-2 px-2">
                                <Info size={14} className="text-mipana-orange mt-0.5 shrink-0" />
                                <p className="text-[9px] font-bold text-gray-400 uppercase leading-normal">
                                    Al confirmar, serás dirigido a la billetera para gestionar el pago (Saldo o Efectivo).
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
