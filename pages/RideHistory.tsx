import React, { useEffect, useState } from 'react';
import { Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { TripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';
import { Ride } from '../types';

const RideHistory: React.FC = () => {
  const { user } = useAuth();
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
        setError('No se pudo cargar el historial.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Cargando historial...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6 animate-fade-in p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="text-mipana-mediumBlue w-8 h-8" />
        <h2 className="text-2xl font-bold text-mipana-darkBlue dark:text-white">
          Historial de Viajes
        </h2>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">No tienes viajes registrados aún.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((ride) => (
            <div key={ride.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4 transition-transform hover:scale-[1.01]">

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                  <span className="text-xs font-mono text-gray-400">
                    {ride.createdAt ? ride.createdAt.toLocaleDateString() + ' ' + ride.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Fecha desconocida'}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${ride.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : ride.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                    {ride.status === 'COMPLETED' ? 'Completado' : ride.status === 'CANCELLED' ? 'Cancelado' : ride.status}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="w-0.5 h-6 bg-gray-200 dark:bg-gray-600"></div>
                    <div className="w-2 h-2 rounded-full bg-mipana-orange"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium dark:text-gray-200 line-clamp-1">{ride.origin}</p>
                    <p className="text-xs text-gray-400 my-1">{ride.distanceKm} km</p>
                    <p className="text-sm font-medium dark:text-gray-200 line-clamp-1">{ride.destination}</p>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-gray-100 dark:border-gray-700 pt-3 sm:pt-0">
                <div className="flex items-center gap-2">
                  {ride.status === 'COMPLETED' ? <CheckCircle size={16} className="text-green-500" /> : ride.status === 'CANCELLED' ? <XCircle size={16} className="text-red-500" /> : <Clock size={16} className="text-blue-500" />}
                  <span className="font-bold text-lg dark:text-white">${ride.priceUsd.toFixed(2)}</span>
                </div>
                <span className="text-xs text-gray-500">Bs {ride.priceVes.toFixed(2)}</span>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RideHistory;