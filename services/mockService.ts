import { Ride, Tariff, User, UserRole, VehicleType, MatchedDriver, ServiceConfig, ServiceId, LiquidationResult, SavedPlace, RecurringRide, GoogleProfile, ChatMessage } from '../types';

// --- CONFIGURACIÓN TASA BCV ---
// Endpoint oficial según documentación: https://dolarapi.com/docs/venezuela/operations/get-dolar-oficial
const BCV_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';

// Variable global para la tasa (Estado simple)
export let mockBcvRate = 46.23; // Valor fallback inicial seguro
export let mockBcvLastUpdate = new Date();

// Función Crítica: Obtener Tasa Oficial
export const fetchBcvRate = async () => {
  try {
    console.log('🔄 Consultando Tasa Oficial BCV...');
    const response = await fetch(BCV_API_URL);
    
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    
    const data = await response.json();
    
    const rate = data.promedio || data.price;
    
    if (typeof rate === 'number' && rate > 0) {
      mockBcvRate = rate;
      mockBcvLastUpdate = new Date(data.fechaActualizacion || Date.now());
      console.log(`✅ Tasa BCV Actualizada: Bs ${mockBcvRate} (Fuente: ${data.fuente || 'BCV'})`);
    } else {
        console.warn('⚠️ Formato de tasa inválido recibido del API, manteniendo tasa anterior.');
    }
  } catch (error) {
    console.error('❌ Error obteniendo tasa BCV (usando valor en memoria):', error);
  }
};

// Ejecutar fetch inicial
fetchBcvRate();

// Actualizar cada 5 minutos para mantener sincronía con BCV
setInterval(fetchBcvRate, 300000);

export const getTariffs = (): Tariff => {
  return {
    currentBcvRate: mockBcvRate,
    lastUpdate: mockBcvLastUpdate
  };
};

export const SERVICE_CATALOG: ServiceConfig[] = [
  {
    id: 'mototaxi',
    nombre: 'Mototaxi',
    tarifa_base_neta_usd: 1.25,
    recargo_km_adicional_neta_usd: 0.50,
    pfs_base_usd: 1.32,
    pfs_km_adicional_usd: 0.535,
    distancia_base_km: 6,
    icono: '🏍️',
    vehicleType: 'MOTO'
  },
  {
    id: 'el_pana',
    nombre: 'El Pana',
    tarifa_base_neta_usd: 2.65,
    recargo_km_adicional_neta_usd: 0.50,
    pfs_base_usd: 2.80,
    pfs_km_adicional_usd: 0.535,
    distancia_base_km: 6,
    icono: '🚗',
    vehicleType: 'CAR'
  },
  {
    id: 'el_amigo',
    nombre: 'El Amigo',
    tarifa_base_neta_usd: 2.00,
    recargo_km_adicional_neta_usd: 0.50,
    pfs_base_usd: 2.12,
    pfs_km_adicional_usd: 0.535,
    distancia_base_km: 6,
    icono: '🚙',
    vehicleType: 'CAR'
  },
  {
    id: 'full_pana',
    nombre: 'Full Pana',
    tarifa_base_neta_usd: 3.49,
    recargo_km_adicional_neta_usd: 0.50,
    pfs_base_usd: 3.69,
    pfs_km_adicional_usd: 0.535,
    distancia_base_km: 6,
    icono: '🚐',
    vehicleType: 'FREIGHT'
  }
];

// Utilidades de redondeo financiero
const round2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;
const roundMoney = (num: number): number => Number(num.toFixed(4)); 

export const calculateLiquidation = (serviceId: ServiceId, distanceKm: number): LiquidationResult => {
  const service = SERVICE_CATALOG.find(s => s.id === serviceId);
  if (!service) throw new Error(`Service ${serviceId} not found`);

  const tasaBcv = mockBcvRate;

  let pfs_usd = service.pfs_base_usd;
  if (distanceKm > service.distancia_base_km) {
    pfs_usd += (distanceKm - service.distancia_base_km) * service.pfs_km_adicional_usd;
  }
  
  pfs_usd = round2(pfs_usd); 
  const pfs_ves = round2(pfs_usd * tasaBcv);

  const pago_bruto_conductor_usd = pfs_usd * 0.95;
  const islr_retenido_usd = pago_bruto_conductor_usd * 0.03;
  const deposito_neto_conductor_usd = pago_bruto_conductor_usd - islr_retenido_usd;

  const comision_bruta_usd = pfs_usd * 0.05;
  const ingreso_neto_app_usd = comision_bruta_usd / 1.16;
  const iva_debito_fiscal_usd = comision_bruta_usd - ingreso_neto_app_usd;

  const total_check = deposito_neto_conductor_usd + ingreso_neto_app_usd + iva_debito_fiscal_usd + islr_retenido_usd;
  const isValid = Math.abs(pfs_usd - total_check) <= 0.02;

  return {
    viaje_id: '', 
    input: {
      servicio_nombre: service.nombre,
      distancia_km: distanceKm,
      pfs_usd: pfs_usd,
      pfs_ves: pfs_ves
    },
    conductor: {
      pago_bruto_usd: roundMoney(pago_bruto_conductor_usd),
      islr_retenido_usd: roundMoney(islr_retenido_usd),
      deposito_neto_usd: roundMoney(deposito_neto_conductor_usd),
      deposito_neto_ves: round2(deposito_neto_conductor_usd * tasaBcv)
    },
    plataforma: {
      comision_bruta_usd: roundMoney(comision_bruta_usd),
      ingreso_neto_app_usd: roundMoney(ingreso_neto_app_usd),
      ingreso_neto_app_ves: round2(ingreso_neto_app_usd * tasaBcv),
      iva_debito_fiscal_usd: roundMoney(iva_debito_fiscal_usd),
      iva_debito_fiscal_ves: round2(iva_debito_fiscal_usd * tasaBcv)
    },
    seniat: {
      total_retenciones_usd: roundMoney(islr_retenido_usd + iva_debito_fiscal_usd),
      total_retenciones_ves: round2((islr_retenido_usd + iva_debito_fiscal_usd) * tasaBcv)
    },
    meta: {
      tasa_bcv: tasaBcv,
      valid: isValid,
      timestamp: new Date()
    }
  };
};

export const calculatePrice = (distanceKm: number, serviceId: ServiceId = 'el_pana'): { usd: number, ves: number, liquidation: LiquidationResult } => {
  const liquidation = calculateLiquidation(serviceId, distanceKm);
  return {
    usd: liquidation.input.pfs_usd,
    ves: liquidation.input.pfs_ves,
    liquidation
  };
};

// --- MOCK DRIVER DATABASE ---
export const MOCK_DRIVERS_POOL: MatchedDriver[] = [
  {
      id: 'driver-99',
      name: 'Carlos El Pana',
      vehicleModel: 'Bera SBR',
      vehicleColor: 'Azul',
      plate: 'AB123CD',
      rating: 4.9,
      phone: '+584121234567',
      avatarUrl: 'https://ui-avatars.com/api/?name=Carlos+Pana&background=0D8ABC&color=fff',
      timeAway: '3 min'
  },
  {
      id: 'driver-88',
      name: 'Luis Veloz',
      vehicleModel: 'Toyota Corolla',
      vehicleColor: 'Gris Plata',
      plate: 'XX999YY',
      rating: 4.8,
      phone: '+584149999999',
      avatarUrl: 'https://ui-avatars.com/api/?name=Luis+Veloz&background=F2620F&color=fff',
      timeAway: '5 min'
  },
  {
      id: 'driver-77',
      name: 'Maria La Rapidita',
      vehicleModel: 'Ford Ka',
      vehicleColor: 'Rojo',
      plate: 'AA111BB',
      rating: 5.0,
      phone: '+584240001122',
      avatarUrl: 'https://ui-avatars.com/api/?name=Maria+R&background=10B981&color=fff',
      timeAway: '7 min'
  }
];

export const getDriverById = (id: string): MatchedDriver | undefined => {
  return MOCK_DRIVERS_POOL.find(d => d.id === id);
};

export const mockMatchDriver = (vehicleType: VehicleType, specificDriverId?: string): Promise<MatchedDriver> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (specificDriverId) {
        const specific = MOCK_DRIVERS_POOL.find(d => d.id === specificDriverId);
        if (specific) {
          resolve(specific);
          return;
        }
      }
      
      // Fallback to finding a random driver with the right vehicle type logic (simplified here to just pick from pool)
      const randomDriver = MOCK_DRIVERS_POOL[Math.floor(Math.random() * MOCK_DRIVERS_POOL.length)];
      resolve({
        ...randomDriver,
        // Adjust vehicle based on requested type if needed for consistency
        vehicleModel: vehicleType === 'MOTO' ? 'Bera SBR' : randomDriver.vehicleModel 
      });
    }, specificDriverId ? 500 : 3000); // Faster if specific driver
  });
};

// GPS SIMULATION ENGINE
// Simulate a ride movement over time
export const startRideSimulation = (onUpdate: (progress: number, eta: number) => void) => {
  let progress = 0;
  const duration = 30000; // 30 seconds ride for demo
  const intervalTime = 100;
  const steps = duration / intervalTime;
  const increment = 100 / steps;

  const interval = setInterval(() => {
    progress += increment;
    const eta = Math.ceil((100 - progress) / 10); // Rough ETA calc
    
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
    }
    
    onUpdate(progress, eta);
  }, intervalTime);

  return () => clearInterval(interval);
};

const generateMockRide = (id: string, serviceId: ServiceId, distance: number, status: Ride['status'], beneficiary?: {name: string, phone?: string}): Ride => {
  const liq = calculateLiquidation(serviceId, distance);
  const service = SERVICE_CATALOG.find(s => s.id === serviceId)!;
  
  // Sample Chat Logs for completed rides
  let logs: ChatMessage[] = [];
  if (status === 'COMPLETED' || status === 'IN_PROGRESS') {
    logs = [
      { id: 'msg1', senderRole: UserRole.PASSENGER, senderName: 'María', text: 'Hola, estoy frente al centro comercial', timestamp: new Date(Date.now() - 100000), read: true },
      { id: 'msg2', senderRole: UserRole.DRIVER, senderName: 'Carlos', text: 'Entendido, llego en 2 minutos', timestamp: new Date(Date.now() - 90000), read: true }
    ];
  }

  return {
    id,
    passengerId: 'user-002',
    origin: 'CC Buenaventura',
    destination: 'Centro Acarigua',
    status,
    vehicleType: service.vehicleType,
    serviceId: service.id,
    priceUsd: liq.input.pfs_usd,
    priceVes: liq.input.pfs_ves,
    distanceKm: distance,
    createdAt: new Date(),
    liquidation: liq,
    currentProgress: status === 'IN_PROGRESS' ? 45 : 0,
    beneficiary: beneficiary,
    chatLogs: logs
  };
};

export const mockRides: Ride[] = [
  generateMockRide('ride-001', 'el_pana', 4.2, 'PENDING'),
  generateMockRide('ride-002', 'mototaxi', 2.5, 'PENDING', { name: 'Mi Mamá', phone: '0414-5550000' }),
  generateMockRide('ride-003', 'full_pana', 8.0, 'COMPLETED')
];

export const mockSavedPlaces: SavedPlace[] = [
  { id: '1', name: 'Casa', address: 'Urb. El Pilar, Calle 3', type: 'HOME', icon: '🏠' },
  { id: '2', name: 'Trabajo', address: 'Centro Empresarial Acarigua', type: 'WORK', icon: '💼' },
  { id: '3', name: 'Mamá', address: 'Barrio La Goajira, Av. 4', type: 'FAVORITE', icon: '❤️' },
  { id: '4', name: 'Gym', address: 'CC Llano Mall', type: 'FAVORITE', icon: '💪' }
];

export const simulateReverseGeocoding = (lat: number, lng: number): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const streets = ['Av. Libertador', 'Calle 32', 'Av. Las Lágrimas', 'Urb. La Espiga', 'Callejón 4', 'Redoma de Araure', 'Av. Alianza'];
      const randomStreet = streets[Math.floor(Math.random() * streets.length)];
      const number = Math.floor(Math.random() * 100);
      resolve(`${randomStreet}, #${number}`);
    }, 600);
  });
};

export const mockLoginUser = (role: UserRole): User => {
  const baseUser = {
    id: `user-${Date.now()}`,
    email: `${role.toLowerCase()}@mipana.app`,
    avatarUrl: `https://ui-avatars.com/api/?name=${role}&background=0D8ABC&color=fff`,
    savedPlaces: role === UserRole.PASSENGER ? mockSavedPlaces : [],
    phone: '+584120000000',
    documentId: 'V-12345678',
    favoriteDriverIds: role === UserRole.PASSENGER ? ['driver-99'] : [] // Mock favorite driver
  };

  switch (role) {
    case UserRole.ADMIN:
      return { ...baseUser, name: 'Admin System', role: UserRole.ADMIN };
    case UserRole.DRIVER:
      return { 
        ...baseUser, 
        name: 'Carlos El Pana', 
        role: UserRole.DRIVER, 
        isOnline: true,
        driverStats: {
          level: 'Pana Oro',
          points: 3450,
          nextLevelPoints: 5000,
          progressPercent: 69,
          completedRides: 142,
          rating: 4.9
        },
        vehicle: {
          model: 'Bera SBR 2024',
          color: 'Azul Metálico',
          plate: 'AB123CD'
        }
      };
    case UserRole.PASSENGER:
    default:
      return { ...baseUser, name: 'María Pérez', role: UserRole.PASSENGER };
  }
};

export const simulateGoogleAuth = (user: User): Promise<GoogleProfile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        email: user.email.replace('@mipana.app', '@gmail.com'),
        name: user.name,
        picture: user.avatarUrl || '',
        connectedAt: new Date(),
        scopes: ['calendar', 'tasks', 'gmail']
      });
    }, 1500);
  });
};

export const mockRecurringRides: RecurringRide[] = [
  {
    id: 'rec-1',
    name: 'Trabajo',
    origin: 'Casa',
    destination: 'Oficina Centro',
    serviceId: 'mototaxi',
    time: '07:30',
    days: [1, 2, 3, 4, 5], 
    active: true,
    syncCalendar: true,
    syncTasks: false,
    forWhom: 'ME'
  }
];

// --- CHAT UTILITIES ---

export const cleanPhoneNumber = (phone?: string): string => {
  if (!phone) return '';
  // Remove spaces, hyphens, parenthesis, and plus signs for WA link
  return phone.replace(/[^0-9]/g, '');
};

export const sendChatMessage = (rideId: string, sender: User, text: string): ChatMessage => {
  return {
    id: `msg-${Date.now()}`,
    senderRole: sender.role,
    senderName: sender.name,
    text: text,
    timestamp: new Date(),
    read: false
  };
};