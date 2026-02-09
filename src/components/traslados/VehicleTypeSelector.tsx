import { Car, Bike } from 'lucide-react';

interface Props {
    selected: 'car' | 'moto';
    onSelect: (type: 'car' | 'moto') => void;
}

export function VehicleTypeSelector({ selected, onSelect }: Props) {
    return (
        <div className="flex gap-4 mb-6">
            <button
                onClick={() => onSelect('car')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${selected === 'car'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
            >
                <div className="flex flex-col items-center gap-2">
                    <Car size={32} className={selected === 'car' ? 'text-blue-600' : 'text-gray-400'} />
                    <span className={`font-medium text-sm ${selected === 'car' ? 'text-blue-700' : 'text-gray-500'}`}>
                        Carro
                    </span>
                    <span className="text-xs text-gray-400">1-4 personas</span>
                </div>
            </button>

            <button
                onClick={() => onSelect('moto')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${selected === 'moto'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
            >
                <div className="flex flex-col items-center gap-2">
                    <Bike size={32} className={selected === 'moto' ? 'text-blue-600' : 'text-gray-400'} />
                    <span className={`font-medium text-sm ${selected === 'moto' ? 'text-blue-700' : 'text-gray-500'}`}>
                        Moto
                    </span>
                    <span className="text-xs text-gray-400">1 persona</span>
                </div>
            </button>
        </div>
    );
}
