import { startTransition } from 'react';

// Using a simple object map for now, can be expanded to full React Router types
export const SERVICE_ROUTES = {
    home: '/',
    traslados: '/traslados',
    billetera: '/billetera',
    tienda: '/tienda',
    delivery: '/delivery',
} as const;

export type ServiceKey = keyof typeof SERVICE_ROUTES;

export function navigateToService(
    navigate: (path: string, options?: any) => void,
    service: ServiceKey,
    options?: { state?: any }
) {
    const route = SERVICE_ROUTES[service];

    // Navegación directa para máxima respuesta y robustez
    if (options?.state) {
        navigate(route, { state: options.state });
    } else {
        navigate(route);
    }
}

export function preloadService(service: ServiceKey) {
    // Logic to preload bundles for specific services
    // This would interface with Vite's preload functionality or dynamic imports
    switch (service) {
        case 'traslados':
            // import('../../pages/traslados/RequestRide'); 
            break;
        // Add others
    }
}
