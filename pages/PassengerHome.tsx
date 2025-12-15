import React, { useState, useEffect, useRef } from 'react';
import LeafletMapComponent from '../components/LeafletMapComponent';
import Button from '../components/Button';
import Input from '../components/Input';
import ChatInterface from '../components/ChatInterface';
import { MapPin, Star, Plus, Home, Briefcase, Clock, Heart, ArrowLeft, Search, User, Users, Smartphone, MessageCircle, Phone, MessageSquare, RefreshCw } from 'lucide-react';
import { calculatePrice, mockMatchDriver, SERVICE_CATALOG, simulateReverseGeocoding, startRideSimulation, sendChatMessage, cleanPhoneNumber, getTariffs, getDriverById } from '../services/mockService';
import { MatchedDriver, ServiceId, SavedPlace, LocationPoint, RideBeneficiary, ChatMessage, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

type RideStep = 'SEARCH' | 'PICK_ON_MAP' | 'CONFIRM_SERVICE' | 'SEARCHING_DRIVER' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';

interface PassengerHomeProps {
  onNavigateWallet?: () => void;
}

const ServiceOption = ({ id, nombre, icono, price, isSelected, onClick }: { id: string, nombre: string, icono: string, price: { usd: number, ves: number }, isSelected: boolean, onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border-2 ${isSelected
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

// Favorite Driver Item Component
const FavoriteDriverItem = ({ driver, onClick }: { driver: MatchedDriver, onClick: () => void }) => {
  return (
    <div onClick={onClick} className="flex flex-col items-center mr-4 cursor-pointer min-w-[70px] group">
      <div className="relative w-14 h-14 mb-1 group-hover:scale-105 transition-transform">
        <img src={driver.avatarUrl} alt={driver.name} className="w-full h-full rounded-full border-2 border-green-500 object-cover p-0.5 bg-white shadow-sm" />
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
          <div className="bg-green-500 text-white text-[8px] px-1 rounded-full font-bold flex items-center gap-0.5">
            <Star size={8} fill="currentColor" /> {driver.rating}
          </div>
        </div>
      </div>
      <p className="text-[10px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight line-clamp-2 w-16">{driver.name}</p>
    </div>
  );
};

const PassengerHome: React.FC<PassengerHomeProps> = ({ onNavigateWallet }) => {
  const { user, addSavedPlace, toggleFavoriteDriver } = useAuth();
  const [step, setStep] = useState<RideStep>('SEARCH');
  const [selectedServiceId, setSelectedServiceId] = useState<ServiceId>('el_pana');
  const [price, setPrice] = useState<{ usd: number, ves: number } | null>(null);
  const [driver, setDriver] = useState<MatchedDriver | null>(null);

  // Specific Driver Request
  const [preselectedDriver, setPreselectedDriver] = useState<MatchedDriver | null>(null);
  const [favoriteDriversList, setFavoriteDriversList] = useState<MatchedDriver[]>([]);

  // Location State
  const [origin, setOrigin] = useState<LocationPoint>({ address: 'Ubicación Actual' });
  const [destination, setDestination] = useState<LocationPoint | null>(null);

  // Map Selection State
  const [pickingType, setPickingType] = useState<'ORIGIN' | 'DESTINATION' | null>(null);
  const [mapCenterAddress, setMapCenterAddress] = useState<string>('');
  const [mapCenterCoords, setMapCenterCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Real User Location tracking from Map
  const [userRealLocation, setUserRealLocation] = useState<{ lat: number, lng: number } | null>(null);

  // Beneficiary State
  const [forWhom, setForWhom] = useState<'ME' | 'OTHER'>('ME');
  const [beneficiary, setBeneficiary] = useState<RideBeneficiary>({ name: '', phone: '' });

  // GPS Tracking State
  const [rideProgress, setRideProgress] = useState(0);
  const [eta, setEta] = useState(0);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Wallet & Rate
  const walletBalance = user?.wallet?.balance || 0;
  const tariff = getTariffs();
  const currentRate = tariff.currentBcvRate;

  // Favorites from Context
  const favorites = user?.savedPlaces || [];
  const isDriverFavorite = driver && user?.favoriteDriverIds?.includes(driver.id);

  // Load Favorite Drivers Data
  useEffect(() => {
    if (user?.favoriteDriverIds) {
      const loadedDrivers = user.favoriteDriverIds
        .map(id => getDriverById(id))
        .filter((d): d is MatchedDriver => !!d);
      setFavoriteDriversList(loadedDrivers);
    } else {
      setFavoriteDriversList([]);
    }
  }, [user?.favoriteDriverIds]);

  // Update price when service/dest changes
  useEffect(() => {
    if (destination) {
      const calculated = calculatePrice(4.2, selectedServiceId); // Mock distance
      setPrice(calculated);
    }
  }, [selectedServiceId, destination]);

  // Handle Map Camera Change (Coordinates)
  const handleMapCameraChange = (coords: { lat: number, lng: number }) => {
    setIsMapMoving(true);
    setMapCenterCoords(coords);
    if (!userRealLocation) setUserRealLocation(coords); // Init user loc if empty

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // Simulate geocoding delay
    debounceTimer.current = setTimeout(async () => {
      // In a real app, we would use Geocoding API with coords.lat, coords.lng
      const addr = await simulateReverseGeocoding(coords.lat, coords.lng);
      setMapCenterAddress(addr);
      setIsMapMoving(false);
    }, 600);
  };

  const handleMapCenterChange = () => {
    // Deprecated in favor of handleMapCameraChange for coords, 
    // keeping empty or removing if unused by child (GoogleMapComponent handles it internaly then calls onCameraChange)
  };

  const confirmMapSelection = () => {
    if (pickingType === 'ORIGIN' && mapCenterCoords) {
      setOrigin({
        address: mapCenterAddress,
        lat: mapCenterCoords.lat,
        lng: mapCenterCoords.lng
      });
    } else if (pickingType === 'DESTINATION' && mapCenterCoords) {
      setDestination({
        address: mapCenterAddress,
        lat: mapCenterCoords.lat,
        lng: mapCenterCoords.lng
      });
      setStep('CONFIRM_SERVICE');
    }
    setPickingType(null);
    if (step === 'PICK_ON_MAP') {
      // If we were just picking dest, go to confirm
      if (pickingType === 'DESTINATION') setStep('CONFIRM_SERVICE');
      else setStep('SEARCH'); // Go back to search if we just fixed origin
    }
  };

  const handleSelectFavoriteDriver = (favDriver: MatchedDriver) => {
    setPreselectedDriver(favDriver);
    // Automatically prompt for destination
    setPickingType('DESTINATION');
    setStep('PICK_ON_MAP');
    // We can't really "recenter" to driver without coords, but we enter pick mode
  };

  // Ride Lifecycle Simulation
  useEffect(() => {
    let isMounted = true;
    let simulationCleanup: (() => void) | undefined;

    if (step === 'SEARCHING_DRIVER') {
      const service = SERVICE_CATALOG.find(s => s.id === selectedServiceId);
      // Pass the preselected driver ID if it exists to force a match
      mockMatchDriver(service?.vehicleType || 'CAR', preselectedDriver?.id).then((d) => {
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
  }, [step, selectedServiceId, preselectedDriver]);

  const resetFlow = () => {
    setStep('SEARCH');
    setDriver(null);
    setPreselectedDriver(null);
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
    const newMsg = sendChatMessage('current-ride-id', user, text);
    setChatMessages([...chatMessages, newMsg]);
  };

  // Mock destinations for 'Real' feel if coords missing (fallback)
  const getOriginCoords = () => {
    if (origin.lat && origin.lng) return { lat: origin.lat, lng: origin.lng };
    return userRealLocation || undefined;
  };

  const getDestCoords = () => {
    if (destination?.lat && destination?.lng) return { lat: destination.lat, lng: destination.lng };
    return undefined;
  };

  return (
    <main className="h-[calc(100vh-5rem)] flex flex-col relative overflow-hidden">

      {/* Mapa Interactivo (Leaflet/OpenStreetMap) */}
      <div className="absolute inset-0 z-0">
        <LeafletMapComponent
          className="flex-1"
          origin={getOriginCoords()}
          destination={getDestCoords()}
          onRouteChange={(summary) => {
            // Handle route change if needed
            console.log('Route:', summary);
          }}
        />
      </div>

      {/* SEARCH STEP UI: Redesigned with Wallet & Inputs */}
      {step === 'SEARCH' && (
        <>
          <div className="absolute top-0 left-0 right-0 z-20 p-4 space-y-3 bg-gradient-to-b from-black/5 to-transparent pb-8">

            {/* HEADER: GREETING & RATE */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-2 pr-4 rounded-full shadow-lg border border-white/50">
                <div className="w-10 h-10 rounded-full bg-mipana-mediumBlue/10 flex items-center justify-center border border-mipana-mediumBlue/20 overflow-hidden">
                  {user?.avatarUrl ? <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" /> : <User className="text-mipana-mediumBlue" size={20} />}
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold flex items-center gap-1">
                    Hola, {user?.name?.split(' ')[0]} <span className="text-lg">👋</span>
                  </p>
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                    <span className="text-[10px] font-bold text-mipana-darkBlue">$1 ↔ Bs {currentRate.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEARCH INPUTS CARD */}
            <div className="bg-white rounded-2xl shadow-xl p-4 animate-slide-up border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">¿A dónde vamos?</p>
              </div>

              {/* Origin Field */}
              <div className="flex items-center gap-3 mb-3 relative group">
                {/* Connecting line */}
                <div className="absolute left-[9px] top-6 h-6 w-0.5 bg-gray-200 z-0"></div>

                <div className="relative z-10 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.15)]"></div>
                </div>
                <div
                  className="flex-1 border-b border-gray-100 pb-2 cursor-pointer hover:bg-gray-50 transition-colors rounded px-2 -ml-2"
                  onClick={() => { setPickingType('ORIGIN'); setStep('PICK_ON_MAP'); }}
                >
                  <p className="text-[10px] text-green-600 font-bold uppercase">Desde</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{origin.address}</p>
                </div>
              </div>

              {/* Dest Field */}
              <div className="flex items-center gap-3 relative group" onClick={() => { setPickingType('DESTINATION'); setStep('PICK_ON_MAP'); }}>
                <div className="relative z-10 w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-mipana-orange shadow-[0_0_0_3px_rgba(242,98,15,0.15)]"></div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl px-3 py-3 flex items-center justify-between border border-gray-200 cursor-pointer hover:border-mipana-mediumBlue transition-colors shadow-inner">
                  <span className="text-gray-400 text-sm font-medium">Ingresar destino...</span>
                  <Search size={18} className="text-mipana-mediumBlue" />
                </div>
              </div>

              {/* FAVORITE DRIVERS SECTION */}
              {favoriteDriversList.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Mis Panas (Favoritos)</p>
                  <div className="flex overflow-x-auto pb-2 scrollbar-hide">
                    {favoriteDriversList.map(fd => (
                      <FavoriteDriverItem
                        key={fd.id}
                        driver={fd}
                        onClick={() => handleSelectFavoriteDriver(fd)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* WALLET WIDGET CARD */}
            <div className="bg-white rounded-2xl shadow-xl p-4 animate-slide-up border border-gray-100 relative overflow-hidden flex items-center justify-between" style={{ animationDelay: '0.1s' }}>
              {/* Decorative BG */}
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl"></div>

              <div className="relative z-10">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                  Saldo disponible
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse block"></span>
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold text-mipana-darkBlue">Bs. {(walletBalance * currentRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="bg-blue-50 px-1.5 rounded text-[10px] font-bold text-blue-700 border border-blue-100">$ {walletBalance.toFixed(2)}</div>
                </div>
              </div>

              <Button
                onClick={onNavigateWallet}
                className="relative z-10 bg-[#ccff00] hover:bg-[#b3e600] text-black border-none shadow-lg font-bold px-6 py-3 rounded-xl active:scale-95 transition-all"
              >
                Recargar
              </Button>
            </div>
          </div>
        </>
      )}


      {/* TOP BAR FOR PICKING/CONFIRMING (Overrides Search Step UI) */}
      {step === 'PICK_ON_MAP' ? (
        <div className="absolute top-4 left-4 right-4 z-20 animate-slide-up">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex items-center gap-3 border border-gray-100 dark:border-gray-700">
            <button onClick={() => { setStep('SEARCH'); setPickingType(null); setPreselectedDriver(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {pickingType === 'ORIGIN' ? 'Fijar Punto de Partida' : 'Fijar Destino'}
              </p>
              {isMapMoving ? (
                <div className="h-5 w-40 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="font-bold text-mipana-darkBlue dark:text-white truncate text-sm">{mapCenterAddress}</p>
              )}
            </div>
            {preselectedDriver && (
              <div className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                <img src={preselectedDriver.avatarUrl} className="w-6 h-6 rounded-full" />
                <span className="text-xs font-bold text-green-800 hidden sm:block">{preselectedDriver.name}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        // CONFIRM SERVICE HEADER
        step === 'CONFIRM_SERVICE' && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-0 overflow-hidden border border-gray-100 dark:border-gray-700 animate-slide-up">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3" onClick={() => { setPickingType('ORIGIN'); setStep('PICK_ON_MAP'); }}>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Desde</p>
                  <p className="text-sm font-medium truncate dark:text-white">{origin.address}</p>
                </div>
              </div>
              <div className="p-3 flex items-center gap-3" onClick={() => { setStep('SEARCH'); }}>
                <div className="w-2 h-2 bg-mipana-orange rounded-full"></div>
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Hasta</p>
                  <p className="text-sm font-medium truncate dark:text-white">{destination?.address}</p>
                </div>
              </div>
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

        {/* CONFIRMATION SHEET */}
        {step === 'CONFIRM_SERVICE' && price && (
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-6 animate-slide-up max-h-[80vh] overflow-y-auto border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg dark:text-white">Confirmar Viaje</h3>
              {destination && !favorites.some(f => f.address === destination.address) && (
                <button onClick={saveCurrentAsFavorite} className="text-xs text-mipana-mediumBlue font-bold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg">
                  <Heart size={12} /> Guardar
                </button>
              )}
            </div>

            {/* Preselected Driver Alert */}
            {preselectedDriver && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-xl mb-4 flex items-center gap-3">
                <img src={preselectedDriver.avatarUrl} className="w-10 h-10 rounded-full border border-green-300" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-green-800 uppercase">Solicitud Directa</p>
                  <p className="text-sm text-green-900">Este viaje será para <b>{preselectedDriver.name}</b></p>
                </div>
                <button onClick={() => setPreselectedDriver(null)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={16} /></button>
              </div>
            )}

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
                    onChange={(e) => setBeneficiary({ ...beneficiary, name: e.target.value })}
                    className="bg-white"
                    icon={<User size={14} />}
                  />
                  <Input
                    placeholder="Teléfono (Opcional)"
                    value={beneficiary.phone}
                    onChange={(e) => setBeneficiary({ ...beneficiary, phone: e.target.value })}
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
              {preselectedDriver ? `Solicitar a ${preselectedDriver.name.split(' ')[0]}` : (forWhom === 'OTHER' ? `Solicitar para ${beneficiary.name || 'otro'}` : 'Solicitar Ahora')}
            </Button>
          </div>
        )}

        {/* SEARCHING & ACTIVE RIDE UI */}
        {step === 'SEARCHING_DRIVER' && (
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-xl shadow-2xl p-8 text-center animate-slide-up">
            <div className="mx-auto w-16 h-16 border-4 border-mipana-orange border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="font-bold text-lg mb-2 dark:text-white">
              {preselectedDriver ? `Esperando confirmación de ${preselectedDriver.name}...` : 'Contactando Panas cercanos...'}
            </h3>
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
                  <Clock size={12} /> ETA: {eta} min
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

            <div className="flex items-center justify-between space-x-4 mb-4">
              <div className="flex items-center gap-4">
                <img src={driver.avatarUrl} alt="Driver" className="w-14 h-14 rounded-full border-2 border-mipana-orange" />
                <div>
                  <h4 className="font-bold dark:text-white text-lg">{driver.name}</h4>
                  <p className="text-xs text-gray-500">{driver.vehicleModel} • {driver.plate}</p>
                </div>
              </div>

              {/* FAVORITE TOGGLE */}
              <button
                onClick={() => toggleFavoriteDriver(driver.id)}
                className={`p-2 rounded-full border transition-colors ${isDriverFavorite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
              >
                <Heart size={20} fill={isDriverFavorite ? "currentColor" : "none"} />
              </button>
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
    </main>
  );
};

export default PassengerHome;
