import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Play, X, ChevronRight, Target, Award, TrendingUp } from 'lucide-react';
import Button from './Button';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    targetElement?: string;
    action?: () => void;
}

const passengerSteps: OnboardingStep[] = [
    {
        id: 'welcome',
        title: '¡Bienvenido a MI PANA APP!',
        description: 'Tu forma más fácil de solicitar viajes en Venezuela. Te guiaremos paso a paso.'
    },
    {
        id: 'search',
        title: 'Busca tu destino',
        description: 'Toca el campo "Ingresar destino" para iniciar tu primer viaje.'
    },
    {
        id: 'wallet',
        title: 'Revisa tu billetera',
        description: 'Aquí puedes recargar saldo rápidamente usando Pago Móvil.'
    },
    {
        id: 'complete',
        title: '¡Listo para rodar!',
        description: 'Ya conoces lo básico. Explora la app y solicita tu primer viaje.'
    }
];

const driverSteps: OnboardingStep[] = [
    {
        id: 'welcome',
        title: '¡Bienvenido Conductor!',
        description: 'Gracias por unirte. Aprende a usar la app en segundos.'
    },
    {
        id: 'online',
        title: 'Conéctate',
        description: 'Usa el botón "Conectar" para recibir solicitudes de viaje cercanas.'
    },
    {
        id: 'profile',
        title: 'Completa tu perfil',
        description: 'Ve a "Mi Perfil" para agregar tus datos fiscales y bancarios.'
    },
    {
        id: 'complete',
        title: '¡Todo listo!',
        description: 'Conéctate y empieza a generar ingresos con MI PANA.'
    }
];

const OnboardingTour: React.FC = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [hasSeenTour, setHasSeenTour] = useState(false);

    const steps = user?.role === 'DRIVER' ? driverSteps : passengerSteps;

    useEffect(() => {
        // Check if user has seen the tour
        const tourKey = `onboarding_tour_${user?.id}`;
        const seen = localStorage.getItem(tourKey);

        if (!seen && user) {
            // Show tour automatically after 2 seconds
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 2000);

            return () => clearTimeout(timer);
        } else {
            setHasSeenTour(true);
        }
    }, [user]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTour();
        }
    };

    const handleSkip = () => {
        completeTour();
    };

    const completeTour = () => {
        const tourKey = `onboarding_tour_${user?.id}`;
        localStorage.setItem(tourKey, 'true');
        setIsOpen(false);
        setHasSeenTour(true);
    };

    if (!isOpen || hasSeenTour) return null;

    const step = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Progress Bar */}
                <div className="h-1 bg-gray-200 dark:bg-gray-700">
                    <div
                        className="h-full bg-gradient-to-r from-mipana-mediumBlue to-mipana-orange transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Header */}
                <div className="p-6 pb-0">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-mipana-mediumBlue to-mipana-darkBlue rounded-full flex items-center justify-center">
                                {currentStep === steps.length - 1 ? (
                                    <Award size={24} className="text-yellow-400" />
                                ) : (
                                    <TrendingUp size={24} className="text-white" />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">
                                    Paso {currentStep + 1} de {steps.length}
                                </p>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {step.title}
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={handleSkip}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 pt-2">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                        {step.description}
                    </p>

                    {/* Illustration based on step */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-8 mb-6 flex items-center justify-center">
                        <Target size={64} className="text-mipana-mediumBlue opacity-50" />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {currentStep > 0 && currentStep < steps.length - 1 && (
                            <Button
                                variant="outline"
                                onClick={handleSkip}
                                className="flex-1"
                            >
                                Omitir
                            </Button>
                        )}
                        <Button
                            variant="action"
                            onClick={handleNext}
                            icon={currentStep === steps.length - 1 ? undefined : <ChevronRight size={16} />}
                            className="flex-1"
                        >
                            {currentStep === steps.length - 1 ? '¡Entendido!' : 'Siguiente'}
                        </Button>
                    </div>

                    {/* Dots indicator */}
                    <div className="flex justify-center gap-2 mt-6">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep
                                        ? 'w-8 bg-mipana-mediumBlue'
                                        : 'w-2 bg-gray-300 dark:bg-gray-600'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTour;
