import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Star } from 'lucide-react';
import { SimpleMap } from '../../components/traslados/SimpleMap';

export default function RideActive() {
    const navigate = useNavigate();
    const { rideId } = useParams();
    const [status, setStatus] = useState<'searching' | 'arriving' | 'in_progress'>('searching');

    // Simulate ride progress
    useEffect(() => {
        const t1 = setTimeout(() => setStatus('arriving'), 3000);
        const t2 = setTimeout(() => setStatus('in_progress'), 6000);
        const t3 = setTimeout(() => navigate(`/traslados/completado/${rideId}`), 9000);

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [navigate, rideId]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative text-gray-800">
            <div className="flex-1 relative">
                <SimpleMap className="w-full h-full absolute inset-0" />

                {/* Floating Header */}
                <div className="absolute top-0 left-0 right-0 p-4 z-10">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-sm border border-gray-200/50 flex items-center justify-between">
                        <span className="font-semibold text-sm">
                            {status === 'searching' && 'Buscando conductor...'}
                            {status === 'arriving' && 'Tu pana llega en 3 min'}
                            {status === 'in_progress' && 'En camino a tu destino'}
                        </span>
                        <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                            EN VIVO
                        </div>
                    </div>
                </div>
            </div>

            {/* Driver/Ride Info Panel */}
            <div className="bg-white rounded-t-3xl shadow-xl z-20 p-6 pb-8 transition-transform duration-300 transform translate-y-0">
                {status === 'searching' ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Buscando conductores cercanos...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                                <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                                    <img src="https://i.pravatar.cc/150?u=driver" alt="Driver" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                                    <Star size={12} className="text-yellow-400 fill-current" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900">Carlos Pérez</h3>
                                <p className="text-gray-500 text-sm">Toyota Corolla • <span className="text-gray-900 font-medium">ABC-123</span></p>
                                <div className="flex items-center gap-1 mt-1">
                                    <Star size={14} className="text-yellow-400 fill-current" />
                                    <span className="text-xs font-bold text-gray-700">4.9</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                    <MessageCircle size={20} className="text-gray-700" />
                                </button>
                                <button className="p-3 bg-green-100 rounded-full hover:bg-green-200 transition-colors">
                                    <Phone size={20} className="text-green-700" />
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    <div className="w-0.5 h-8 bg-gray-200" />
                                    <div className="w-2 h-2 rounded-full bg-gray-900" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between h-14">
                                    <div>
                                        <p className="text-xs text-gray-400">Origen</p>
                                        <p className="text-sm font-medium text-gray-900">Ubicación Actual</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Destino</p>
                                        <p className="text-sm font-medium text-gray-900">Centro Comercial Buenaventura</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
