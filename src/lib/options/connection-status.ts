import { useState, useEffect } from 'react';

type ConnectionStatus = 'online' | 'offline' | 'slow';

interface ConnectionState {
    status: ConnectionStatus;
    isOnline: boolean;
    lastCheck: number;
}

// Singleton state to be shared if needed outside React
let globalConnectionStatus: ConnectionStatus = navigator.onLine ? 'online' : 'offline';

export function useConnectionStatus() {
    const [status, setStatus] = useState<ConnectionStatus>(globalConnectionStatus);

    useEffect(() => {
        const handleOnline = () => {
            // Check effective connection type if available (Chrome only)
            const connection = (navigator as any).connection;
            if (connection && (connection.saveData || connection.effectiveType === '2g')) {
                updateStatus('slow');
            } else {
                updateStatus('online');
            }
        };

        const handleOffline = () => updateStatus('offline');

        const updateStatus = (newStatus: ConnectionStatus) => {
            globalConnectionStatus = newStatus;
            setStatus(newStatus);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        if (!navigator.onLine) {
            updateStatus('offline');
        } else {
            handleOnline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        status,
        isOnline: status !== 'offline',
        isSlow: status === 'slow',
        networkText: status === 'offline' ? 'Sin conexión' : status === 'slow' ? 'Conexión lenta' : 'Conectado'
    };
}

// Helper for non-React contexts
export function getConnectionStatus(): ConnectionStatus {
    return globalConnectionStatus;
}
