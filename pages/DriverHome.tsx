


import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import MapPlaceholder from '../components/MapPlaceholder';
import ChatInterface from '../components/ChatInterface';
import { mockRides, calculateLiquidation, SERVICE_CATALOG, startRideSimulation, sendChatMessage, cleanPhoneNumber } from '../services/mockService';
import { MapPin, DollarSign, Navigation, Trophy, Star, Phone, MessageCircle, XCircle, Info, User, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Ride, ServiceId, ChatMessage, UserRole } from '../types';

const DriverHome: React.FC = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [availableRides, setAvailableRides] = useState<Ride[]>(mockRides);

  // GPS Tracking for Driver View
  const [gpsProgress, setGpsProgress] = useState(0);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Simulate incoming requests
  useEffect(() => {
    if (!isOnline || activeRide) return;

    const interval = setInterval(() => {
      const randomService = SERVICE_CATALOG[Math.floor(Math.random() * SERVICE_CATALOG.length)];
      const distance = Number((Math.random() * 10 + 1).toFixed(1));
      const liq = calculateLiquidation(randomService.id, distance);
      
      // 30% chance of being a ride for someone else
      const isForOther = Math.random() < 0.3;
      const beneficiary = isForOther ? { name: 'Pedro Perez (Amigo)', phone: '0412-0000000' } : undefined;

      const newRide: Ride = {
        id: `req-${Date.now()}`,
        passengerId: `p-${Math.floor(Math.random()*1000)}`,
        origin: ['CC Llano Mall', 'Plaza Bolivar', 'Terminal', 'Urb. El Pilar'][Math.floor(Math.random()*4)],
        destination: ['La Espiga', 'Araure Centro', 'Agua Blanca', 'Rio Acarigua'][Math.floor(Math.random()*4)],
        status: 'PENDING',
        vehicleType: randomService.vehicleType,
        serviceId: randomService.id,
        priceUsd: liq.input.pfs_usd,
        priceVes: liq.input.pfs_ves,
        distanceKm: distance,
        createdAt: new Date(),
        liquidation: liq,
        beneficiary: beneficiary,
        chatLogs: []
      };
      
      // Only add if less than 5 rides to avoid clutter
      setAvailableRides(prev => prev.length < 5 ? [newRide, ...prev] : prev);
    }, 12000); // New request every 12 seconds

    return () => clearInterval(interval);
  }, [isOnline, activeRide]);

  // Simulate GPS movement when ride is active
  useEffect(() => {
    if (activeRide && activeRide.status === 'IN_PROGRESS') {
      const cleanup = startRideSimulation((progress) => {
         setGpsProgress(progress);
      });
      return cleanup;
    } else {
      setGpsProgress(0);
    }
  }, [activeRide?.status]);

  const acceptRide = (ride: Ride) => {
    setActiveRide({ ...ride, status: 'IN_PROGRESS' });
    setAvailableRides(prev => prev.filter(r => r.id !== ride.id));
    setChatMessages([]);
  };

  const rejectRide = (id: string) => {
    setAvailableRides(prev => prev.filter(r => r.id !== id));
  };

  const completeRide = () => {
    setActiveRide(null);
    setGpsProgress(0);
    setIsChatOpen(false);
  };

  const getServiceIcon = (serviceId: ServiceId) => {
    const service = SERVICE_CATALOG.find(s => s.id === serviceId);
    return service ? service.icono : '🚗';
  };

  // Communication Handlers
  const handleWhatsApp = () => {
    if (!activeRide) return;
    // Prefer beneficiary phone if available
    const targetPhone = activeRide.beneficiary?.phone || '+584120000000'; // Mock fallback
    const targetName = activeRide.beneficiary?.name || 'Pasajero';
    
    const text = `Hola ${targetName}, soy ${user?.name}, tu conductor de Mi Pana App. Voy en camino.`;
    const url = `https://wa.me/${cleanPhoneNumber(targetPhone)}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCall = () => {
    if (!activeRide) return;
    const targetPhone = activeRide.beneficiary?.phone || '+584120000000';
    window.open(`tel:${targetPhone}`, '_self');
  };

  const handleSendMessage = (text: string) => {
    if (!user) return;
    const newMsg = sendChatMessage(activeRide?.id || '', user, text);
    setChatMessages([...chatMessages, newMsg]);
  };

  return (
    <div className="space-y-6 pb-20 h-full flex flex-col relative">
      {/* Header Status */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm shrink-0">
         <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="font-medium dark:text-white">{isOnline ? 'En Línea' : 'Desconectado'}</span>
         </div>
         <button 
          onClick={() => setIsOnline(!isOnline)}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            isOnline 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isOnline ? 'Desconectar' : 'Conectar'}
        </button>
      </div>

      {/* CHAT INTERFACE OVERLAY */}
      {activeRide && (
        <ChatInterface 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          currentUserRole={UserRole.DRIVER}
          title={`Chat con ${activeRide.beneficiary?.name || 'Pasajero'}`}
        />
      )}

      {/* Active Ride View */}
      {activeRide ? (
        <div className="flex-1 flex flex-col animate-slide-up h-full">
           <div className="bg-mipana-mediumBlue text-white p-4 rounded-t-xl flex justify-between items-center shrink-0">
              <span className="font-bold flex items-center gap-2">
                {getServiceIcon(activeRide.serviceId)} Viaje en Curso
              </span>
              <span className="bg-white/20 px-2 py-1 rounded text-xs">#{activeRide.id.slice(-4)}</span>
           </div>
           
           {/* Map for Active Ride */}
           <div className="h-64 w-full bg-gray-200 relative">
              <MapPlaceholder 
                status="IN_PROGRESS" 
                className="rounded-none" 
                currentProgress={gpsProgress}
              />
              <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-lg shadow text-xs font-bold">
                <Navigation size={16} className="inline mr-1 text-blue-600"/> Navegación Activa
              </div>
           </div>

           <div className="bg-white dark:bg-gray-800 p-6 rounded-b-xl shadow-lg border-t-0 flex-1 flex flex-col">
              
              {/* BENEFICIARY ALERT CARD */}
              {activeRide.beneficiary && (
                <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-3">
                   <div className="bg-orange-100 p-2 rounded-full">
                      <Users size={20} className="text-orange-600" />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-orange-800 uppercase">Pasajero Invitado</p>
                      <p className="font-bold text-gray-900 text-lg">{activeRide.beneficiary.name}</p>
                      <p className="text-sm text-gray-600">{activeRide.beneficiary.phone}</p>
                   </div>
                </div>
              )}

              <div className="flex justify-between items-start mb-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                <div className="text-center flex-1 border-r border-gray-200 dark:border-gray-600">
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ganancia Neta</p>
                   <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">${activeRide.liquidation?.conductor.deposito_neto_usd.toFixed(2)}</h3>
                   <p className="text-xs text-gray-400">Bs {activeRide.liquidation?.conductor.deposito_neto_ves.toFixed(2)}</p>
                </div>
                <div className="text-center flex-1">
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Retención ISLR</p>
                   <h3 className="text-xl font-bold text-gray-400">${activeRide.liquidation?.conductor.islr_retenido_usd.toFixed(2)}</h3>
                </div>
              </div>

              <div className="space-y-6 relative mb-6">
                 <div className="absolute left-[9px] top-2 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-600"></div>

                 <div className="flex gap-4 relative z-10">
                    <div className="mt-1">
                       <div className="w-5 h-5 rounded-full bg-green-500 border-4 border-white dark:border-gray-800 shadow-sm"></div>
                    </div>
                    <div>
                       <p className="text-xs text-gray-500">Recoger en:</p>
                       <p className="font-medium dark:text-gray-200">{activeRide.origin}</p>
                    </div>
                 </div>

                 <div className="flex gap-4 relative z-10">
                    <div className="mt-1">
                       <div className="w-5 h-5 rounded-full bg-mipana-orange border-4 border-white dark:border-gray-800 shadow-sm"></div>
                    </div>
                    <div>
                       <p className="text-xs text-gray-500">Destino:</p>
                       <p className="font-medium dark:text-gray-200">{activeRide.destination}</p>
                    </div>
                 </div>
              </div>

               {/* COMMUNICATION ACTIONS FOR DRIVER */}
               <div className="grid grid-cols-3 gap-2 mt-auto mb-4">
                  <button 
                    onClick={handleWhatsApp}
                    className="flex flex-col items-center justify-center p-2 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
                  >
                     <MessageCircle size={20} className="text-green-600 mb-1" />
                     <span className="text-[10px] font-bold text-green-800">WhatsApp</span>
                  </button>
                  <button 
                    onClick={() => setIsChatOpen(true)}
                    className="flex flex-col items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
                  >
                     <div className="relative">
                       <MessageSquare size={20} className="text-blue-600 mb-1" />
                       {chatMessages.length > 0 && (
                         <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
                       )}
                     </div>
                     <span className="text-[10px] font-bold text-blue-800">Chat App</span>
                  </button>
                  <button 
                    onClick={handleCall}
                    className="flex flex-col items-center justify-center p-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                  >
                     <Phone size={20} className="text-gray-600 mb-1" />
                     <span className="text-[10px] font-bold text-gray-800">Llamar</span>
                  </button>
               </div>

              <Button variant="action" fullWidth onClick={completeRide}>
                 Completar Viaje
              </Button>
           </div>
        </div>
      ) : (
         <div className="space-y-4">
            <h3 className="font-bold text-mipana-darkBlue dark:text-white px-2">Solicitudes Cercanas</h3>
            {!isOnline && (
               <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                     <XCircle size={24} />
                  </div>
                  <p>Conéctate para ver solicitudes</p>
               </div>
            )}
            {isOnline && availableRides.length === 0 && (
               <div className="text-center py-12 text-gray-400">
                  <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 animate-pulse">
                     <Navigation size={24} />
                  </div>
                  <p>Buscando pasajeros...</p>
               </div>
            )}
            {isOnline && availableRides.map(ride => (
               <div key={ride.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-slide-up">
                  {ride.beneficiary && (
                     <div className="mb-2 bg-orange-50 text-orange-800 text-[10px] font-bold uppercase px-2 py-1 rounded w-fit flex items-center gap-1">
                        <Users size={12} /> Pasajero: {ride.beneficiary.name}
                     </div>
                  )}
                  <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-2">
                        <span className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg text-lg">
                           {getServiceIcon(ride.serviceId)}
                        </span>
                        <div>
                           <p className="font-bold text-lg text-green-600 dark:text-green-400">
                             ${ride.liquidation?.conductor.deposito_neto_usd.toFixed(2)}
                           </p>
                           <p className="text-xs text-gray-500">Neto Ganancia</p>
                        </div>
                     </div>
                     <div className="text-right">
                       <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold block mb-1">{ride.distanceKm} km</span>
                       <span className="text-[10px] text-gray-400">ISLR: -${ride.liquidation?.conductor.islr_retenido_usd.toFixed(2)}</span>
                     </div>
                  </div>

                  <div className="space-y-2 mb-4">
                     <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-gray-600 dark:text-gray-300 truncate">{ride.origin}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-mipana-orange"></div>
                        <span className="text-gray-600 dark:text-gray-300 truncate">{ride.destination}</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <Button variant="outline" onClick={() => rejectRide(ride.id)}>Rechazar</Button>
                     <Button variant="primary" onClick={() => acceptRide(ride)}>Aceptar</Button>
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
};

export default DriverHome;
