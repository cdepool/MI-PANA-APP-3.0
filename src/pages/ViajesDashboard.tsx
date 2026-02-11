import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, CheckCircle, XCircle, ChevronRight, Plus, Car } from 'lucide-react';
import { TripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';
import { Ride } from '../types';
import Button from '../components/Button';
import { motion } from 'framer-motion';

const ViajesDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState<Ride[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            try {
                const rides = await TripService.getTripHistory(user.id);
                setHistory(rides);
            } catch (err) {
                setError('No se pudo cargar el historial de viajes.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mipana-orange"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
            <div className="max-w-md mx-auto p-4 space-y-6">

                {/* Header */}
                <header className="flex justify-between items-center pt-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-mipana-darkBlue rounded-xl flex items-center justify-center shadow-lg">
                            <Car size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-mipana-darkBlue dark:text-white tracking-tight">Mis Viajes</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Panel de Control</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <ChevronRight className="rotate-180" size={20} />
                    </button>
                </header>

                {/* CTA: New Ride */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-mipana-darkBlue to-blue-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-mipana-orange/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-mipana-orange/20 transition-colors"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-lg font-black tracking-tight">¿A dónde vamos hoy?</h2>
                            <p className="text-xs text-blue-200 font-medium">Pide un Pana en segundos</p>
                        </div>
                        <button
                            onClick={() => navigate('/traslados')}
                            className="bg-mipana-orange hover:bg-orange-600 text-white p-3 rounded-2xl shadow-lg shadow-orange-900/40 active:scale-95 transition-all"
                        >
                            <Plus size={24} strokeWidth={3} />
                        </button>
                    </div>
                </motion.div>

                {/* Summary Stats (Optional but nice) */}
                {history.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Viajes</p>
                            <p className="text-lg font-black text-mipana-darkBlue dark:text-white">{history.length}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Invertido (USD)</p>
                            <p className="text-lg font-black text-mipana-darkBlue dark:text-white">
                                ${history.reduce((acc, ride) => acc + (ride.status === 'COMPLETED' ? ride.priceUsd : 0), 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                )}

                {/* History List */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} className="text-mipana-orange" />
                            Historial Reciente
                        </h3>
                    </div>

                    {error && <p className="text-center text-red-500 py-4 font-bold">{error}</p>}

                    {history.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-gray-400 font-medium">No tienes viajes registrados aún.</p>
                            <button
                                onClick={() => navigate('/traslados')}
                                className="mt-4 text-mipana-mediumBlue font-bold text-sm"
                            >
                                Comienza tu primer viaje →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((ride, idx) => (
                                <motion.div
                                    key={ride.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between gap-4 transition-all hover:shadow-md cursor-pointer"
                                    onClick={() => ride.id && navigate(`/traslados/completado/${ride.id}`)}
                                >
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                {ride.createdAt ? ride.createdAt.toLocaleDateString() : ''}
                                            </span>
                                            <span className={`px-2 py-0.5 text-[9px] rounded-full font-black uppercase tracking-tighter ${ride.status === 'COMPLETED'
                                                    ? 'bg-green-100 text-green-700'
                                                    : ride.status === 'CANCELLED'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {ride.status === 'COMPLETED' ? 'Completado' : ride.status === 'CANCELLED' ? 'Cancelado' : ride.status}
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="flex flex-col items-center gap-1 pt-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-mipana-orange"></div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-200 line-clamp-1">{ride.origin}</p>
                                                <p className="text-[10px] text-gray-400 my-1 font-medium">{ride.distanceKm} km</p>
                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-200 line-clamp-1">{ride.destination}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-between py-1">
                                        <div className="text-right">
                                            <p className="font-black text-lg text-mipana-darkBlue dark:text-white">${ride.priceUsd.toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-gray-400">Bs {ride.priceVes.toFixed(2)}</p>
                                        </div>
                                        {ride.status === 'COMPLETED' ? (
                                            <CheckCircle size={16} className="text-green-500" />
                                        ) : ride.status === 'CANCELLED' ? (
                                            <XCircle size={16} className="text-red-500" />
                                        ) : (
                                            <Clock size={16} className="text-blue-500" />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Navigation (Simple version as we are in a sub-page likely with bottom nav in the future) */}
        </div>
    );
};

export default ViajesDashboard;
