import React, { useState, useEffect } from 'react';
import {
  Navigation,
  ShieldCheck,
  Activity,
  MapPin,
  Users,
  Clock,
  Phone,
  MessageCircle,
  XCircle,
  Power,
  TrendingUp,
  Star
} from 'lucide-react';
import UnifiedMapComponent from '../components/UnifiedMapComponent';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { mockRides, getServiceIcon } from '../services/simulationService';
import { Ride } from '../types';

const DriverHome: React.FC = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED'>('IDLE');

  useEffect(() => {
    if (isOnline && !activeRide) {
      setAvailableRides(mockRides.filter(r => r.status === 'REQUESTED'));
    } else {
      setAvailableRides([]);
    }
  }, [isOnline, activeRide]);

  const toggleOnline = () => setIsOnline(!isOnline);

  const acceptRide = (ride: Ride) => {
    setActiveRide({ ...ride, status: 'ACCEPTED' });
    setStatus('ACCEPTED');
    setAvailableRides([]);
  };

  const startRide = () => {
    if (activeRide) {
      setActiveRide({ ...activeRide, status: 'IN_PROGRESS' });
      setStatus('IN_PROGRESS');
    }
  };

  const completeRide = () => {
    setStatus('COMPLETED');
  };

  const resetFlow = () => {
    setActiveRide(null);
    setStatus('IDLE');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Nivel</p>
          <p className="text-sm font-bold text-mipana-navy flex items-center gap-1">
            <Star size={12} className="text-orange-400 fill-orange-400" /> Oro
          </p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Hoy</p>
          <p className="text-sm font-bold text-green-600">$42.50</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Rating</p>
          <p className="text-sm font-bold text-mipana-navy">4.95</p>
        </div>
      </div>

      {/* Map Section */}
      <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg border border-gray-200">
        <UnifiedMapComponent
          status={status === 'IDLE' ? 'IDLE' : status === 'ACCEPTED' ? 'ACCEPTED' : 'IN_PROGRESS'}
          origin={activeRide?.originCoords}
          destination={activeRide?.destinationCoords}
        />

        {/* Online/Offline Toggle Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
          <div className={`px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto transition-colors ${isOnline ? 'bg-green-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-xs font-bold uppercase tracking-wider">{isOnline ? 'En Línea' : 'Desconectado'}</span>
          </div>

          <button
            onClick={toggleOnline}
            className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center pointer-events-auto transition-all active:scale-90 ${isOnline ? 'bg-red-500 text-white' : 'bg-mipana-navy text-white'}`}
          >
            <Power size={24} />
          </button>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-h-[180px]">
        {status === 'IDLE' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-mipana-navy flex items-center gap-2">
                <Activity size={18} className="text-cyan-500" />
                {isOnline ? 'Solicitudes Cercanas' : 'Sistema en Pausa'}
              </h3>
              {isOnline && <span className="text-[10px] font-bold text-cyan-500 animate-pulse">BUSCANDO...</span>}
            </div>

            {!isOnline ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">Conéctate para empezar a recibir viajes y ganar dinero.</p>
              </div>
            ) : availableRides.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No hay solicitudes en tu zona ahora mismo.</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                {availableRides.map(ride => (
                  <div key={ride.id} className="min-w-[280px] bg-gray-50 rounded-xl p-4 border border-gray-100 snap-center">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getServiceIcon(ride.serviceId)}</span>
                        <div>
                          <p className="font-bold text-green-600">${ride.liquidation?.conductor.deposito_neto_usd.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Ganancia Neta</p>
                        </div>
                      </div>
                      <span className="bg-mipana-navy text-white text-[10px] font-bold px-2 py-1 rounded-full">{ride.distanceKm} km</span>
                    </div>
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="truncate">{ride.origin}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        <span className="truncate">{ride.destination}</span>
                      </div>
                    </div>
                    <Button fullWidth onClick={() => acceptRide(ride)}>Aceptar Viaje</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : status === 'ACCEPTED' || status === 'IN_PROGRESS' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src="https://ui-avatars.com/api/?name=Pasajero&background=00BCD4&color=fff" className="w-12 h-12 rounded-full border-2 border-mipana-navy" alt="User" />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <p className="font-bold text-mipana-navy">{activeRide?.beneficiary?.name || 'Pasajero'}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">En camino al origen</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // WhatsApp Logic
                    const phone = activeRide?.beneficiary?.phone || '';
                    if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                    else window.open(`https://wa.me/?text=Hola, soy tu conductor de Mi Pana App`, '_blank');
                  }}
                  className="p-3 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                >
                  <MessageCircle size={20} />
                </button>
                <button
                  onClick={() => {
                    // Call Logic
                    const phone = activeRide?.beneficiary?.phone || '';
                    if (phone) window.open(`tel:${phone}`);
                  }}
                  className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <Phone size={20} />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-mipana-navy" />
                <p className="text-xs font-medium text-gray-600 truncate max-w-[200px]">
                  {status === 'ACCEPTED' ? activeRide?.origin : activeRide?.destination}
                </p>
              </div>
              <span className="text-[10px] font-bold text-mipana-navy bg-white px-2 py-1 rounded-lg shadow-sm">
                {status === 'ACCEPTED' ? 'RECOGER' : 'DESTINO'}
              </span>
            </div>

            <Button
              fullWidth
              variant={status === 'ACCEPTED' ? 'action' : 'primary'}
              onClick={status === 'ACCEPTED' ? startRide : completeRide}
            >
              {status === 'ACCEPTED' ? 'Iniciar Viaje' : 'Finalizar Viaje'}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="font-bold text-mipana-navy text-lg">¡Viaje Completado!</h3>
              <p className="text-sm text-gray-500">Has ganado <span className="font-bold text-green-600">${activeRide?.liquidation?.conductor.deposito_neto_usd.toFixed(2)}</span></p>
            </div>
            <Button fullWidth onClick={resetFlow}>Listo para el siguiente</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverHome;
