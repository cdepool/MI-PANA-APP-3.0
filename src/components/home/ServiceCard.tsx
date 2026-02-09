import { memo } from 'react';
import { checkServiceAvailability } from '../../lib/options/offline-service-availability';

interface ServiceCardProps {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
    isOnline: boolean;
}

function ServiceCardComponent({ id, name, description, icon, color, onClick, isOnline }: ServiceCardProps) {
    const { isAvailable, offlineMessage } = checkServiceAvailability(id);
    const isDisabled = !isAvailable;

    return (
        <div
            onClick={!isDisabled ? onClick : undefined}
            className={`
        relative overflow-hidden rounded-2xl p-4 min-h-[140px] flex flex-col justify-between
        transition-all duration-200 shadow-sm
        ${isDisabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'cursor-pointer hover:shadow-md hover:scale-[1.02] bg-white'}
      `}
            style={{ borderLeft: `4px solid ${color}` }}
        >
            <div className="flex justify-between items-start">
                <div
                    className="p-2 rounded-xl text-white"
                    style={{ backgroundColor: color }}
                >
                    {icon}
                </div>
                {offlineMessage && (
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        Offline
                    </span>
                )}
            </div>

            <div className="mt-3">
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{name}</h3>
                <p className="text-gray-500 text-xs mt-1 leading-snug">{description}</p>
            </div>

            {!isAvailable && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center p-4">
                    <p className="text-xs font-medium text-center text-gray-800 bg-white/90 p-2 rounded-lg shadow-sm border border-gray-100">
                        {offlineMessage}
                    </p>
                </div>
            )}
        </div>
    );
}

export const ServiceCard = memo(ServiceCardComponent);
