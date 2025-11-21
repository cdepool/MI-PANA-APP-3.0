import React from 'react';
import { Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { mockRides } from '../services/mockService';

const RideHistory: React.FC = () => {
  // Simulate a larger history by duplicating mock rides
  const history = [...mockRides, ...mockRides].map((ride, i) => ({
    ...ride,
    id: `hist-${i}`,
    status: i % 3 === 0 ? 'CANCELLED' : 'COMPLETED',
    createdAt: new Date(Date.now() - (i * 86400000)) // Subtract days
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-mipana-darkBlue dark:text-white flex items-center gap-2">
        <Clock className="text-mipana-mediumBlue" />
        Historial de Viajes
      </h2>

      <div className="space-y-4">
        {history.map((ride, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4">
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                <span className="text-xs font-mono text-gray-400">{ride.createdAt.toLocaleDateString()}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                  ride.status === 'COMPLETED' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {ride.status === 'COMPLETED' ? 'Completado' : 'Cancelado'}
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
                  {ride.status === 'COMPLETED' ? <CheckCircle size={16} className="text-green-500"/> : <XCircle size={16} className="text-red-500"/>}
                  <span className="font-bold text-lg dark:text-white">${ride.priceUsd.toFixed(2)}</span>
               </div>
               <span className="text-xs text-gray-500">Bs {ride.priceVes.toFixed(2)}</span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default RideHistory;