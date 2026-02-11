import { startTransition } from 'react';

// Using a simple object map for now, can be expanded to full React Router types
export const SERVICE_ROUTES = {
    home: '/',
    traslados: '/viajes',
    billetera: '/billetera',
    tienda: '/tienda',
    delivery: '/delivery',
} as const;

export type ServiceKey = keyof typeof SERVICE_ROUTES;

export function navigateToService(
    navigate: (path: string) => void,
    service: ServiceKey,
    options?: { state?: any }
) {
    const route = SERVICE_ROUTES[service];

    // Use React 18 startTransition to keep UI responsive during navigation
    startTransition(() => {
        navigate(route); // In React Router v6, navigate accepts state in options, but here we just pass path for now.
        // If passing state: navigate(route, { state: options?.state })
    });
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
