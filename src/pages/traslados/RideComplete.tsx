import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function RideComplete() {
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);

    const handleFinish = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <CheckCircle size={40} className="text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Llegaste a tu destino!</h1>
            <p className="text-gray-500 mb-8">Tu viaje ha finalizado con éxito.</p>

            <div className="w-full max-w-sm bg-gray-50 rounded-2xl p-6 mb-8">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                    <span className="text-gray-500">Total pagado</span>
                    <span className="text-xl font-bold text-gray-900">$5.50</span>
                </div>

                <p className="text-sm font-medium text-gray-700 mb-4">Califica a tu conductor</p>
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="p-2 transition-transform hover:scale-110 focus:outline-none"
                        >
                            <Star
                                size={32}
                                className={`${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleFinish}
                className="w-full max-w-sm py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
                Volver al inicio
            </button>
        </div>
    );
}
