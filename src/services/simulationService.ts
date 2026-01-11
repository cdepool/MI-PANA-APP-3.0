import { Ride, User, UserRole, VehicleType, MatchedDriver, SavedPlace, RecurringRide, GoogleProfile, ChatMessage, ServiceId } from '../types';
import { SERVICE_CATALOG, calculateLiquidation, round2, roundMoney } from './pricingService';

// --- MOCK DRIVER DATABASE ---
export const MOCK_DRIVERS_POOL: MatchedDriver[] = [
    {
        id: 'driver-001',
        name: 'Pedro "El Rápido" González',
        vehicleModel: 'Chevrolet Aveo',
        vehicleColor: 'Blanco',
        plate: 'AA456BB',
        rating: 4.95,
        phone: '+584121111111',
        avatarUrl: 'https://ui-avatars.com/api/?name=Pedro+Gonzalez&background=10B981&color=fff',
        timeAway: '2 min'
    },
    {
        id: 'driver-002',
        name: 'Ana "La Segura" Rodríguez',
        vehicleModel: 'Nissan Versa',
        vehicleColor: 'Gris',
        plate: 'BB789CC',
        rating: 5.0,
        phone: '+584142222222',
        avatarUrl: 'https://ui-avatars.com/api/?name=Ana+Rodriguez&background=8B5CF6&color=fff',
        timeAway: '4 min'
    },
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

const generateMockRide = (id: string, serviceId: ServiceId, distance: number, status: Ride['status'], beneficiary?: { name: string, phone?: string }): Ride => {
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

    // Acarigua / Araure Coords Validation
    const baseLat = 9.56;
    const baseLng = -69.21;

    return {
        id,
        passengerId: 'user-002',
        origin: 'CC Buenaventura',
        destination: 'Centro Acarigua',
        originCoords: { lat: baseLat + Math.random() * 0.01, lng: baseLng + Math.random() * 0.01 },
        destinationCoords: { lat: baseLat - Math.random() * 0.01, lng: baseLng - Math.random() * 0.01 },
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
    generateMockRide('ride-001', 'el_pana', 4.2, 'REQUESTED'),
    generateMockRide('ride-002', 'mototaxi', 2.5, 'REQUESTED', { name: 'Mi Mamá', phone: '0414-5550000' }),
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
        phone: '04120000000',
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

export const getServiceIcon = (serviceId: ServiceId): string => {
    const service = SERVICE_CATALOG.find(s => s.id === serviceId);
    return service?.icono || '🚗';
};

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
