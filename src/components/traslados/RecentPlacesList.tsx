import { Clock } from 'lucide-react';
import { RecentActivityCache } from '../../lib/options/recent-activity-cache';

interface Props {
    onSelect: (place: any) => void;
}

export function RecentPlacesList({ onSelect }: Props) {
    // Mock data - replace with RecentActivityCache.getAll() filtered by type 'ride'
    const recentPlaces = [
        { id: '1', title: 'Casa', subtitle: 'Urb. El Pilar' },
        { id: '2', title: 'Trabajo', subtitle: 'Centro Acarigua' },
        { id: '3', title: 'Gym', subtitle: 'Llano Mall' },
    ];

    if (recentPlaces.length === 0) return null;

    return (
        <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Recientes</h3>
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x no-scrollbar">
                {recentPlaces.map((place) => (
                    <button
                        key={place.id}
                        onClick={() => onSelect(place)}
                        className="flex-shrink-0 snap-start bg-white p-3 rounded-xl border border-gray-100 shadow-sm min-w-[140px] text-left hover:border-blue-200 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Clock size={14} className="text-blue-500" />
                            <span className="font-semibold text-sm text-gray-900 truncate">{place.title}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{place.subtitle}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}
