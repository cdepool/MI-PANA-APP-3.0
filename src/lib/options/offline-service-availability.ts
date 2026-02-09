import { getConnectionStatus } from './connection-status';

export interface ServiceAvailability {
    id: string;
    isAvailable: boolean;
    offlineMessage?: string;
}

export function checkServiceAvailability(serviceId: string): ServiceAvailability {
    const status = getConnectionStatus();
    const isOnline = status !== 'offline';

    switch (serviceId) {
        case 'traslados':
            return {
                id: 'traslados',
                isAvailable: isOnline,
                offlineMessage: isOnline ? undefined : 'Necesitas conexión para pedir un pana',
            };
        case 'delivery':
            return {
                id: 'delivery',
                isAvailable: isOnline,
                offlineMessage: isOnline ? undefined : 'Necesitas conexión para pedir delivery',
            };
        case 'billetera':
            return {
                id: 'billetera',
                isAvailable: true, // Always open, shows cached balance
                offlineMessage: isOnline ? undefined : 'Mostrando saldo guardado',
            };
        case 'tienda':
            return {
                id: 'tienda',
                isAvailable: true, // Always open, shows cached catalog
                offlineMessage: isOnline ? undefined : 'Catálogo offline',
            };
        default:
            return { id: serviceId, isAvailable: true };
    }
}
