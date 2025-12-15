import React, { useRef, useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface PlacesAutocompleteProps {
    onPlaceSelected: (place: { address: string; lat: number; lng: number }) => void;
    placeholder?: string;
    defaultValue?: string;
    className?: string;
    icon?: React.ReactNode;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
    onPlaceSelected,
    placeholder = 'Buscar dirección...',
    defaultValue = '',
    className = '',
    icon
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (!inputRef.current || !window.google) {
            setError('Google Maps no está cargado');
            return;
        }

        try {
            // Initialize Autocomplete
            const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 've' }, // Restrict to Venezuela
                fields: ['formatted_address', 'geometry', 'name'],
                types: ['address'] // Only addresses, not businesses
            });

            autocompleteRef.current = autocomplete;

            // Listen for place selection
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();

                if (!place.geometry || !place.geometry.location) {
                    setError('No se pudo obtener la ubicación');
                    return;
                }

                setError(null);
                onPlaceSelected({
                    address: place.formatted_address || place.name || '',
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                });
            });

            setIsLoading(false);
        } catch (err) {
            console.error('Error initializing Places Autocomplete:', err);
            setError('Error al inicializar búsqueda');
            setIsLoading(false);
        }

        return () => {
            if (autocompleteRef.current) {
                window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [onPlaceSelected]);

    return (
        <div className="relative">
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="text"
                    defaultValue={defaultValue}
                    placeholder={placeholder}
                    className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
                    disabled={isLoading}
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={18} className="animate-spin text-blue-500" />
                    </div>
                )}
            </div>
            {error && (
                <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-1 ml-1">
                Powered by Google Places
            </p>
        </div>
    );
};

export default PlacesAutocomplete;
