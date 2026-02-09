import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useConnectionStatus } from '../../lib/options/connection-status';

interface Props {
    onSelect: (place: any) => void;
    placeholder?: string;
    initialValue?: string;
}

export function DestinationSearchInput({ onSelect, placeholder = "¿A dónde vamos?", initialValue = '' }: Props) {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { isOnline } = useConnectionStatus();
    const debounceTimer = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        if (!query || query.length < 3 || !isOnline) {
            setSuggestions([]);
            return;
        }

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Mock API call for now - replace with actual Google Places API or Edge Function
                // const results = await searchPlaces(query); 
                const mockResults = [
                    { description: 'Centro Comercial Buenaventura', place_id: '1' },
                    { description: 'Plaza Bolívar de Acarigua', place_id: '2' },
                    { description: 'Terminal de Pasajeros', place_id: '3' },
                ].filter(p => p.description.toLowerCase().includes(query.toLowerCase()));

                setSuggestions(mockResults);
            } catch (error) {
                console.error('Search error', error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [query, isOnline]);

    return (
        <div className="relative z-20">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-10 py-3 border-2 border-transparent focus:border-blue-500 rounded-xl bg-white shadow-sm text-sm focus:outline-none transition-all duration-200"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={!isOnline}
                />
                {query && (
                    <button
                        onClick={() => { setQuery(''); setSuggestions([]); }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                )}
            </div>

            {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-60 overflow-y-auto">
                    {suggestions.map((place) => (
                        <button
                            key={place.place_id}
                            onClick={() => {
                                setQuery(place.description);
                                setSuggestions([]);
                                onSelect(place);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                        >
                            <div className="font-medium text-gray-900">{place.description}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
