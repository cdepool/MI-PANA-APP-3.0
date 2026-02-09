import { useConnectionStatus } from '../../lib/options/connection-status';
import { MapPin } from 'lucide-react';

interface Props {
    className?: string;
}

export function SimpleMap({ className = '' }: Props) {
    const { isOnline } = useConnectionStatus();
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const hasApiKey = apiKey && apiKey.length > 0;

    if (!isOnline) {
        return (
            <div className={`bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-center p-6 ${className}`}>
                <div className="bg-gray-200 p-4 rounded-full mb-3">
                    <MapPin className="text-gray-400" size={32} />
                </div>
                <p className="text-gray-500 font-medium text-sm">Mapa no disponible offline</p>
                <p className="text-gray-400 text-xs mt-1">Pero puedes seleccionar tus destinos recientes</p>
            </div>
        );
    }

    return (
        <div className={`bg-blue-50 rounded-2xl relative overflow-hidden ${className}`}>
            {/* Real Map Integration Point */}
            {hasApiKey ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center relative">
                    <div className="text-center p-4">
                        <MapPin className="mx-auto text-blue-500 mb-2" size={32} />
                        <p className="text-gray-700 font-medium text-sm">Google Maps API Detectada</p>
                        <p className="text-gray-500 text-xs">(Modo Developer)</p>
                    </div>
                    {/* 
              TODO: Uncomment when @react-google-maps/api is configured
              <GoogleMap mapContainerClassName="w-full h-full" center={...} zoom={14} /> 
            */}
                </div>
            ) : (
                <>
                    <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=9.5606,-69.2081&zoom=14&size=600x300')] bg-cover bg-center opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm flex items-center gap-2 transform -translate-y-8">
                            <MapPin size={16} />
                            Ubicación actual
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
