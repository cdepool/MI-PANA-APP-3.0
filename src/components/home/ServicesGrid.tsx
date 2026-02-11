import { useNavigate } from 'react-router-dom';
import { Car, Wallet, ShoppingBag, Truck } from 'lucide-react';
import { ServiceCard } from './ServiceCard';
import { navigateToService } from '../../lib/options/service-router';
import { useConnectionStatus } from '../../lib/options/connection-status';

export function ServicesGrid() {
    const navigate = useNavigate();
    const { isOnline } = useConnectionStatus();

    const services = [
        {
            id: 'traslados',
            name: 'Viajes',
            description: 'Muévete rápido en carro o moto',
            color: '#007AFF', // Blue
            icon: <Car size={24} />,
        },
        {
            id: 'billetera',
            name: 'Billetera',
            description: 'Recarga y paga en comercios',
            color: '#10B981', // Green
            icon: <Wallet size={24} />,
        },
        {
            id: 'tienda',
            name: 'Tienda',
            description: 'Compra lo que necesitas',
            color: '#F59E0B', // Amber
            icon: <ShoppingBag size={24} />,
        },
        {
            id: 'delivery',
            name: 'Delivery',
            description: 'Comida y medicinas a tu puerta',
            color: '#EF4444', // Red
            icon: <Truck size={24} />,
        },
    ] as const;

    return (
        <section className="grid grid-cols-2 gap-4 px-4 py-2">
            {services.map((service) => (
                <ServiceCard
                    key={service.id}
                    {...service}
                    isOnline={isOnline}
                    onClick={() => navigateToService(navigate, service.id)}
                />
            ))}
        </section>
    );
}
