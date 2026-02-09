import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { DestinationSearchInput } from '../../components/traslados/DestinationSearchInput';
import { RecentPlacesList } from '../../components/traslados/RecentPlacesList';
import { SimpleMap } from '../../components/traslados/SimpleMap';
import { ConnectionStatusChip } from '../../components/shared/ConnectionStatusChip';

export default function RequestRide() {
    const navigate = useNavigate();
    const [destination, setDestination] = useState<any>(null);

    const handleSelectPlace = (place: any) => {
        setDestination(place);
    };

    const handleContinue = () => {
        if (destination) {
            navigate('/traslados/estimacion', { state: { destination } });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <ConnectionStatusChip />

            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-4 bg-white shadow-sm z-10">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Pedir un pana</h1>
            </header>

            <div className="flex-1 flex flex-col p-4">
                {/* Search Section */}
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                        <p className="text-sm font-medium text-gray-700">Ubicación actual</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-900" />
                        <div className="flex-1">
                            <DestinationSearchInput onSelect={handleSelectPlace} />
                        </div>
                    </div>
                </div>

                {/* Map or Recents */}
                <div className="flex-1 relative min-h-[300px]">
                    <SimpleMap className="w-full h-full absolute inset-0 rounded-2xl shadow-inner border border-gray-200" />
                </div>

                <RecentPlacesList onSelect={handleSelectPlace} />
            </div>

            {/* Footer CTA */}
            <div className="p-4 bg-white border-t border-gray-100">
                <button
                    onClick={handleContinue}
                    disabled={!destination}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all ${destination
                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Continuar
                </button>
            </div>
        </div>
    );
}
