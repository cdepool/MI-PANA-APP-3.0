


import React, { useState, useEffect, useRef } from 'react';
import MapPlaceholder from '../components/MapPlaceholder';
import Button from '../components/Button';
import Input from '../components/Input';
import ChatInterface from '../components/ChatInterface';
import { MapPin, Star, Plus, Home, Briefcase, Clock, Heart, ArrowLeft, Search, User, Users, Smartphone, MessageCircle, Phone, MessageSquare } from 'lucide-react';
import { calculatePrice, mockMatchDriver, SERVICE_CATALOG, simulateReverseGeocoding, startRideSimulation, sendChatMessage, cleanPhoneNumber } from '../services/mockService';
import { MatchedDriver, ServiceId, SavedPlace, LocationPoint, RideBeneficiary, ChatMessage, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

type RideStep = 'SEARCH' | 'PICK_ON_MAP' | 'CONFIRM_SERVICE' | 'SEARCHING_DRIVER' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';

const ServiceOption = ({ id, nombre, icono, price, isSelected, onClick }: { id: string, nombre: string, icono: string, price: {usd: number, ves: number}, isSelected: boolean, onClick: () => void }) => {
  return (
    <button 
      onClick={onClick}
      className={`relative p-3 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border-2 ${
        isSelected 
          ? 'border-mipana-mediumBlue bg-mipana-mediumBlue/10 shadow-md transform scale-105' 
          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 opacity-70 hover:opacity-100'
      }`}
    >
      <div className="text-2xl mb-1">{icono}</div>
      <span className={`text-xs font-bold ${isSelected ? 'text-mipana-darkBlue dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
        {nombre}
      </span>
      <div className="mt-1 text-xs font-bold text-green-600">
        ${price.usd.toFixed(2)}
      </div>
    </button>
  );
};

// Quick access pill component
const QuickFavorite = ({ place, onClick }: { place: SavedPlace, onClick: () => void }) => {
  const getIcon = () => {
    if (place.type === 'HOME') return <Home size={14} className="text-blue-500" />;
    if (place.type === 'WORK') return <Briefcase size={14} className="text-orange-500" />;
    return <Heart size={14} className="text-red-500" />;
  };

  return (
    <button 
      onClick={onClick}
      className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-w-fit"
    >
      {place.icon ? <span className="text-sm">{place.icon}</span> : getIcon()}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{place.name}</span>
    </button>
  );
};

const PassengerHome: React.FC = () => {
  const { user, addSavedPlace } = useAuth();
  const [step, setStep] = useState<RideStep>('SEARCH');
  const [selectedServiceId, setSelectedServiceId] = useState<ServiceId>('el_pana');
  const [price, setPrice] = useState<{usd: number, ves: number} | null>(null);
  const [driver, setDriver] = useState<MatchedDriver | null>(null);
  
  // Location State
  const [origin, setOrigin] = useState<LocationPoint>({ address: 'Ubicación Actual (CC Buenaventura)' });
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  
  // Map Selection State
  const [pickingType, setPickingType] = useState<'ORIGIN' | 'DESTINATION' | null>(null);
  const [mapCenterAddress, setMapCenterAddress] = useState<string>('');
  const [isMapMoving, setIsMapMoving] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Beneficiary State
  const [forWhom, setForWhom] = useState<'ME' | 'OTHER'>('ME');
  const [beneficiary, setBeneficiary] = useState<RideBeneficiary>({ name: '', phone: '' });

  // GPS Tracking State
  const [rideProgress, setRideProgress] = useState(0);
  const [eta, setEta] = useState(0);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Derived state for favorites from Context
  const favorites = user?.savedPlaces || [];

  // Update price when service/dest changes
  useEffect(() => {
    if (destination) {
      const calculated = calculatePrice(4.2, selectedServiceId); // Mock distance
      setPrice(calculated);
    }
  }, [selectedServiceId, destination]);

  // Handle Map Interaction for Picking Location
  const handleMapCenterChange = () => {
    setIsMapMoving(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    // Simulate geocoding delay
    debounceTimer.current = setTimeout(async () => {
      // Mock coords, randomizing slightly
      const addr = await simulateReverseGeocoding(10, 10);
      setMapCenterAddress(addr);
      setIsMapMoving(false);
    }, 600);
  };

  const confirmMapSelection = () => {
    if (pickingType === 'ORIGIN') {
      setOrigin({ address: mapCenterAddress });
    } else if (pickingType === 'DESTINATION') {
      setDestination({ address: mapCenterAddress });
      setStep('CONFIRM_SERVICE');
    }
    setPickingType(null);
    if (step === 'PICK_ON_MAP') {
       // If we were just picking dest, go to confirm
       if (pickingType === 'DESTINATION') setStep('CONFIRM_SERVICE');
       else setStep('SEARCH'); // Go back to search if we just fixed origin
    }
  };

  const handleFavoriteClick = (place: SavedPlace) => {
    setDestination({ address: place.address });
    setStep('CONFIRM_SERVICE');
  };

  // Ride Lifecycle Simulation
  useEffect(() => {
    let isMounted = true;
    let simulationCleanup: (() => void) | undefined;

    if (step === 'SEARCHING_DRIVER') {
      const service = SERVICE_CATALOG.find(s => s.id === selectedServiceId);
      mockMatchDriver(service?.vehicleType || 'CAR').then((d) => {
        if (isMounted) {
          setDriver(d);
          setStep('ACCEPTED');
          setChatMessages([]); // Reset chat for new ride
        }
      });
    } else if (step === 'ACCEPTED') {
      // Driver is arriving
      setTimeout(() => { 
        if (isMounted) setStep('IN_PROGRESS'); 
      }, 4000);
    } else if (step === 'IN_PROGRESS') {
      // Start GPS Simulation
      simulationCleanup = startRideSimulation((progress, estimatedMins) => {
        if (!isMounted) return;
        setRideProgress(progress);
        setEta(estimatedMins);
        if (progress >= 100) {
          setStep('COMPLETED');
        }
      });
    }

    return () => {
      isMounted = false;
      if (simulationCleanup) simulationCleanup();
    };
  }, [step, selectedServiceId]);

  const resetFlow = () => {
    setStep('SEARCH');
    setDriver(null);
    setDestination(null);
    setRideProgress(0);
    setForWhom('ME');
    setBeneficiary({ name: '', phone: '' });
    setChatMessages([]);
    setIsChatOpen(false);
  };

  const getMapStatus = () => {
     if (pickingType === 'ORIGIN') return 'PICKING_ORIGIN';
     if (pickingType === 'DESTINATION') return 'PICKING_DEST';
     if (step === 'SEARCHING_DRIVER' || step === 'CONFIRM_SERVICE') return 'SEARCHING';
     if (step === 'ACCEPTED') return 'ACCEPTED';
     if (step === 'IN_PROGRESS') return 'IN_PROGRESS';
     if (step === 'COMPLETED') return 'COMPLETED';
     return 'IDLE';
  };

  const handleConfirmRide = () => {
    if (forWhom === 'OTHER' && !beneficiary.name) {
      alert("Por favor ingresa el nombre de la persona que viaja.");
      return;
    }
    setStep('SEARCHING_DRIVER');
  };

  // Add current selection to favorites via Context
  const saveCurrentAsFavorite = () => {
     if (!destination) return;
     const name = prompt("Nombre para este lugar (Ej: Casa de Juan):", "Nuevo Destino");
     if (!name) return;

     const newPlace: SavedPlace = {
       id: Date.now().toString(),
       name: name,
       address: destination.address,
       type: 'FAVORITE',
       icon: '📍'
     };
     addSavedPlace(newPlace);
  };

  // Communication Handlers
  const handleWhatsApp = () => {
    if (!driver) return;
    const text = `Hola ${driver.name}, soy ${user?.name}. Estoy esperando mi viaje en Mi Pana App.`;
    const url = `https://wa.me/${cleanPhoneNumber(driver.phone)}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCall = () => {
    if (!driver) return;
    window.open(`tel:${driver.phone}`, '_self');
  };

  const handleSendMessage = (text: string) => {
    if (!user) return;
    // Add message to local state to simulate instant update
    // In real app, this goes to backend and returns via socket
    const newMsg = sendChatMessage('current-ride-id', user, text);
    setChatMessages([...chatMessages, newMsg]);
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col relative">
      
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapPlaceholder 
          className="h-full w-full rounded-none md:rounded-xl" 
          status={getMapStatus()} 
          onCenterChange={handleMapCenterChange}
          currentProgress={rideProgress}
        />
      </div>

      {/* TOP BAR */}
      {step === 'PICK_ON_MAP' ? (
         <div className="absolute top-4 left-4 right-4 z-20 animate-slide-up">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex items-center gap-3 border border-gray-100 dark:border-gray-700">
               <button onClick={() => { setStep('SEARCH'); setPickingType(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                 <ArrowLeft />
               </button>
               <div className="flex-1">
                 <p className="text-xs text-gray-400 font-bold uppercase">
                   {pickingType === 'ORIGIN' ? 'Fijar Punto de Partida' : 'Fijar Destino'}
                 </p>
                 {isMapMoving ? (
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                 ) : (
                    <p className="font-semibold text-mipana-darkBlue dark:text-white truncate">{mapCenterAddress}</p>
                 )}
               </div>
            </div>
         </div>
      ) : (
        (step === 'SEARCH' || step === 'CONFIRM_SERVICE') && (
          <div className="absolute top-4 left-4 right-4 z-20 max-w-md mx-auto">
              {/* Origin Input */}
              <div className="bg-white dark:bg-gray-800 rounded-t-xl shadow-sm p-3 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700">
                 <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
                 <div className="flex-1 cursor-pointer" onClick={() => { setPickingType('ORIGIN'); setStep('PICK_ON_MAP'); handleMapCenterChange(); }}>
                   <p className="text-xs text-gray-400">Punto de partida</p>
                   <p className="text-sm font-medium dark:text-gray-200 truncate">{origin.address}</p>
                 </div>
              </div>
              {/* Destination Input */}
              <div className="bg-white dark:bg-gray-800 rounded-b-xl shadow-lg p-3 flex items-center gap-3">
                 <div className="w-2 h-2 bg-mipana-orange rounded-full shadow-lg shadow-orange-500/50"></div>
                 {step === 'CONFIRM_SERVICE' ? (
                    <div className="flex-1 cursor-pointer" onClick={() => setStep('SEARCH')}>
                       <p className="text-xs text-gray-400">Destino</p>
                       <p className="text-sm font-medium dark:text-gray-200 truncate">{destination?.address}</p>
                    </div>
                 ) : (
                    <div className="flex-1 relative">
                       <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400"/>
                       <input 
                         type="text" 
                         placeholder="¿A dónde vamos hoy?" 
                         className="w-full pl-6 bg-transparent focus:outline-none text-sm dark:text-white"
                         onFocus={() => setPickingType(null)} // Just focusing text
                       />
                    </div>
                 )}
                 {/* Map Pick Button */}
                 {step === 'SEARCH' && (
                   <button 
                      onClick={() => { setPickingType('DESTINATION'); setStep('PICK_ON_MAP'); handleMapCenterChange(); }}
                      className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-mipana-mediumBlue hover:bg-gray-200"
                   >
                      <MapPin size={18} />
                   </button>
                 )}
              </div>
          </div>
        )
      )}

      {/* CHAT INTERFACE OVERLAY */}
      {driver && (
        <ChatInterface 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          currentUserRole={UserRole.PASSENGER}
          title={`Chat con ${driver.name}`}
        />
      )}

      {/* BOTTOM SHEET / CONTEXT MENU */}
      <div className="z-10 mt-auto md:mb-4 md:ml-4 md:max-w-sm w-full">
        
        {/* PICK ON MAP FLOATING ACTION */}
        {step === 'PICK_ON_MAP' && (
           <div className="p-4 w-full flex justify-center pb-8">
              <Button 
                onClick={confirmMapSelection} 
                disabled={isMapMoving} 
                className="shadow-2xl w-full max-w-xs animate-bounce-in"
              >
                 {isMapMoving ? 'Ubicando...' : 'Confirmar Ubicación'}
              </Button>
           </div>
        )}

        {/* SEARCH VIEW: FAVORITES & RECENT */}
        {step === 'SEARCH' && (
           <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-xl shadow-2xl p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-mipana-darkBlue dark:text-white">Favoritos</h3>
                 <button 
                   onClick={() => { setPickingType('DESTINATION'); setStep('PICK_ON_MAP'); handleMapCenterChange(); }}
                   className="text-mipana-mediumBlue text-xs font-bold flex items-center gap-1"
                 >
                   <Plus size={14}/> Agregar
                 </button>
              </div>
              
              <div className="flex space-x-3 overflow-x-auto pb-4 no-scrollbar mb-4">
                 {favorites.map((place) => (
                    <QuickFavorite key={place.id} place={place} onClick={() => handleFavoriteClick(place)} />
                 ))}
                 <button 
                    onClick={() => { setPickingType('DESTINATION'); setStep('PICK_ON_MAP'); handleMapCenterChange(); }}
                    className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-full border border-dashed border-gray-300 min-w-fit text-gray-400"
                 >
                    <Plus size={14} />
                    <span className="text-sm">Nuevo</span>
                 </button>
              </div>

              <div className="space-y-3">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recientes</p>
                 <div className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors" onClick={() => { setDestination({address: 'Centro Acarigua'}); setStep('CONFIRM_SERVICE');}}>
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                       <Clock size={16} className="text-gray-500"/>
                    </div>
                    <div className="flex-1 border-b border-gray-100 dark:border-gray-700 pb-2">
                       <p className="font-medium dark:text-gray-200">Centro Acarigua</p>
                       <p className="text-xs text-gray-400">Av. Libertador</p>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* CONFIRMATION SHEET */}
        {step === 'CONFIRM_SERVICE' && price && (
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-xl shadow-2xl p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg dark:text-white">Confirmar Viaje</h3>
                 {destination && !favorites.some(f => f.address === destination.address) && (
                    <button onClick={saveCurrentAsFavorite} className="text-xs text-mipana-mediumBlue font-bold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                       <Heart size={12} /> Guardar
                    </button>
                 )}
              </div>

              {/* BENEFICIARY SELECTION */}
              <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl mb-4 border border-gray-100 dark:border-gray-600">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">¿Para quién es el viaje?</p>
                <div className="flex gap-2 mb-3">
                   <button 
                    onClick={() => setForWhom('ME')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${forWhom === 'ME' ? 'bg-mipana-mediumBlue text-white shadow' : 'bg-white dark:bg-gray-700 text-gray-500'}`}
                   >
                     <User size={16} /> Para Mí
                   </button>
                   <button 
                    onClick={() => setForWhom('OTHER')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${forWhom === 'OTHER' ? 'bg-mipana-mediumBlue text-white shadow' : 'bg-white dark:bg-gray-700 text-gray-500'}`}
                   >
                     <Users size={16} /> Para Otro
                   </button>
                </div>

                {forWhom === 'OTHER' && (
                  <div className="space-y-2 animate-fade-in">
                     <Input 
                       placeholder="Nombre del Pasajero (Ej: Mamá)" 
                       value={beneficiary.name}
                       onChange={(e) => setBeneficiary({...beneficiary, name: e.target.value})}
                       className="bg-white"
                       icon={<User size={14} />}
                     />
                     <Input 
                       placeholder="Teléfono (Opcional)" 
                       value={beneficiary.phone}
                       onChange={(e) => setBeneficiary({...beneficiary, phone: e.target.value})}
                       className="bg-white"
                       icon={<Smartphone size={14} />}
                     />
                  </div>
                )}
              </div>

              <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Selecciona Vehículo</p>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto mb-4">
                 {SERVICE_CATALOG.map(service => {
                   const sPrice = calculatePrice(4.2, service.id);
                   return (
                    <ServiceOption 
                        key={service.id}
                        id={service.id}
                        nombre={service.nombre}
                        icono={service.icono}
                        price={sPrice}
                        isSelected={selectedServiceId === service.id}
                        onClick={() => setSelectedServiceId(service.id)}
                     />
                   )
                 })}
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                 <div className="flex items-center gap-2">
                    <div className="bg-green-100 p-1 rounded text-green-700 font-bold text-xs">EFECTIVO</div>
                    <span className="text-xs text-gray-500">o Pago Móvil</span>
                 </div>
                 <span className="font-bold text-lg dark:text-white">${price.usd.toFixed(2)}</span>
              </div>

              <Button variant="action" fullWidth onClick={handleConfirmRide}>
                 Solicitar {forWhom === 'OTHER' ? 'para ' + (beneficiary.name || 'otro') : 'Ahora'}
              </Button>
          </div>
        )}

        {/* SEARCHING & ACTIVE RIDE UI */}
        {step === 'SEARCHING_DRIVER' && (
           <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-xl shadow-2xl p-8 text-center animate-slide-up">
              <div className="mx-auto w-16 h-16 border-4 border-mipana-orange border-t-transparent rounded-full animate-spin mb-4"></div>
              <h3 className="font-bold text-lg mb-2 dark:text-white">Contactando Panas cercanos...</h3>
              <Button variant="outline" onClick={() => setStep('CONFIRM_SERVICE')}>Cancelar</Button>
           </div>
        )}
        
        {(step === 'ACCEPTED' || step === 'IN_PROGRESS') && driver && (
            <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-xl shadow-2xl p-6 animate-slide-up">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold text-mipana-darkBlue dark:text-white">
                    {step === 'IN_PROGRESS' ? 'Viaje en Curso' : '¡Pana en camino!'}
                 </h3>
                 {step === 'IN_PROGRESS' ? (
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                       <Clock size={12}/> ETA: {eta} min
                    </span>
                 ) : (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">{driver.timeAway}</span>
                 )}
               </div>
               
               {/* GPS Progress Bar */}
               {step === 'IN_PROGRESS' && (
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mb-4 overflow-hidden">
                     <div className="h-full bg-mipana-mediumBlue transition-all duration-500" style={{ width: `${rideProgress}%` }}></div>
                  </div>
               )}

               <div className="flex items-center space-x-4 mb-4">
                 <img src={driver.avatarUrl} alt="Driver" className="w-14 h-14 rounded-full border-2 border-mipana-orange" />
                 <div className="flex-1">
                   <h4 className="font-bold dark:text-white text-lg">{driver.name}</h4>
                   <p className="text-xs text-gray-500">{driver.vehicleModel} • {driver.plate}</p>
                 </div>
               </div>
               
               {/* COMMUNICATION ACTIONS */}
               <div className="grid grid-cols-3 gap-2 mb-4">
                  <button 
                    onClick={handleWhatsApp}
                    className="flex flex-col items-center justify-center p-2 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
                  >
                     <MessageCircle size={24} className="text-green-600 mb-1" />
                     <span className="text-[10px] font-bold text-green-800">WhatsApp</span>
                  </button>
                  <button 
                    onClick={() => setIsChatOpen(true)}
                    className="flex flex-col items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
                  >
                     <div className="relative">
                       <MessageSquare size={24} className="text-blue-600 mb-1" />
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
                     <Phone size={24} className="text-gray-600 mb-1" />
                     <span className="text-[10px] font-bold text-gray-800">Llamar</span>
                  </button>
               </div>
            </div>
        )}

        {step === 'COMPLETED' && driver && (
             <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-xl shadow-2xl p-6 animate-slide-up text-center">
                <div className="mb-4 inline-block p-4 rounded-full bg-green-100 text-green-600">
                   <Star size={32} fill="currentColor" />
                </div>
                <h3 className="text-2xl font-bold text-mipana-darkBlue dark:text-white mb-2">¡Llegaste Pana!</h3>
                <Button fullWidth variant="action" onClick={resetFlow}>
                     Finalizar
                </Button>
             </div>
        )}

      </div>
    </div>
  );
};

export default PassengerHome;
