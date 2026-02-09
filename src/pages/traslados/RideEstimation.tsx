import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { VehicleTypeSelector } from '../../components/traslados/VehicleTypeSelector';
import { PriceEstimationCard } from '../../components/traslados/PriceEstimationCard';
import { ConnectionStatusChip } from '../../components/shared/ConnectionStatusChip';
import { invokeEdgeFunction } from '../../lib/supabase/client';

export default function RideEstimation() {
    const navigate = useNavigate();
    const location = useLocation();
    const [vehicleType, setVehicleType] = useState<'car' | 'moto'>('car');
    const [loading, setLoading] = useState(true);
    const [isRequesting, setIsRequesting] = useState(false);
    const [estimation, setEstimation] = useState({ price: 0, time: '' });

    // Mock calculation simulation
    useEffect(() => {
        setLoading(true);
        // Future: Call 'calculate-fare' edge function here
        const timer = setTimeout(() => {
            setEstimation({
                price: vehicleType === 'car' ? 5.50 : 3.00,
                time: '8-12 min'
            });
            setLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, [vehicleType]);

    const handleConfirm = async () => {
        setIsRequesting(true);
        try {
            const destination = location.state?.destination;

            // Call Edge Function
            const response = await invokeEdgeFunction('request-ride', {
                user_id: 'current-user-id', // Replace with real auth user id
                origin: 'current-location',
                destination: destination,
                vehicle_type: vehicleType
            });

            if (response && response.ride_id) {
                navigate(`/traslados/activo/${response.ride_id}`);
            } else {
                throw new Error('No ride ID returned');
            }
        } catch (error) {
            console.error('Failed to request ride:', error);
            alert('Error al pedir el viaje. Intenta de nuevo.');
            // Fallback for demo if backend is not reachable locally
            navigate(`/traslados/activo/${crypto.randomUUID()}`);
        } finally {
            setIsRequesting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ConnectionStatusChip />

            <header className="px-4 py-4 flex items-center gap-4 bg-white shadow-sm z-10">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Confirmar viaje</h1>
            </header>

            <div className="flex-1 p-4">
                {/* Route Summary */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                            <div>
                                <p className="text-xs text-gray-500">Origen</p>
                                <p className="font-medium text-gray-900">Ubicación actual</p>
                            </div>
                        </div>
                        <div className="w-0.5 h-4 bg-gray-200 ml-1.5 -my-2" />
                        <div className="flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-gray-900" />
                            <div>
                                <p className="text-xs text-gray-500">Destino</p>
                                <p className="font-medium text-gray-900">
                                    {location.state?.destination?.description || 'Seleccionar destino'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <VehicleTypeSelector selected={vehicleType} onSelect={setVehicleType} />

                <PriceEstimationCard
                    price={estimation.price}
                    time={estimation.time}
                    loading={loading}
                />
            </div>

            <div className="p-4 bg-white border-t border-gray-100 pb-8">
                <button
                    onClick={handleConfirm}
                    disabled={loading || isRequesting}
                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Calculando...' : isRequesting ? 'Solicitando...' : 'Confirmar Viaje'}
                </button>
            </div>
        </div>
    );
}
