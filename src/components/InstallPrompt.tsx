import React, { useState, useEffect } from 'react';
import { Download, X, Bell, Smartphone } from 'lucide-react';
import Button from './Button';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

interface InstallPromptProps {
    onClose?: () => void;
    forceShow?: boolean;
}

/**
 * PWA Install Prompt Component
 * Shows a modal encouraging users to install the app for push notifications
 * Required for iOS Web Push (16.4+)
 */
const InstallPrompt: React.FC<InstallPromptProps> = ({ onClose, forceShow = false }) => {
    const { user } = useAuth();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        const installed = notificationService.isPWAInstalled();
        setIsInstalled(installed);

        // Detect iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(iOS);

        // Show prompt if not installed and notifications needed
        if (!installed && (forceShow || !localStorage.getItem('installPromptDismissed'))) {
            setIsVisible(true);
        }

        // Listen for install prompt (Android/Desktop Chrome)
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, [forceShow]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            // Chrome/Android native prompt
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('[InstallPrompt] User accepted install');
                setIsVisible(false);

                // Request notification permission after install
                if (user) {
                    setTimeout(() => {
                        notificationService.requestPermission(user.id);
                    }, 2000);
                }
            }

            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem('installPromptDismissed', 'true');
        setIsVisible(false);
        onClose?.();
    };

    const handleEnableNotifications = async () => {
        if (user) {
            const granted = await notificationService.requestPermission(user.id);
            if (granted) {
                setIsVisible(false);
                onClose?.();
            }
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-mipana-navy to-mipana-mediumBlue p-6 text-white relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 text-white/80 hover:text-white"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                            <img src="/logo-app.png" alt="MI PANA" className="w-12 h-12" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Instala MI PANA APP</h2>
                            <p className="text-white/80 text-sm">Para una mejor experiencia</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {isInstalled ? (
                        // App is installed, just need notification permission
                        <>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Bell size={20} className="text-cyan-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Activa las Notificaciones</h3>
                                    <p className="text-sm text-gray-600">
                                        Recibe alertas cuando un conductor acepte tu viaje o cuando llegue a recogerte.
                                    </p>
                                </div>
                            </div>

                            <Button fullWidth onClick={handleEnableNotifications}>
                                <Bell size={18} />
                                Activar Notificaciones
                            </Button>
                        </>
                    ) : isIOS ? (
                        // iOS instructions
                        <>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h3 className="font-semibold text-blue-900 mb-2">En iPhone/iPad:</h3>
                                <ol className="text-sm text-blue-800 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="bg-blue-200 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                                        <span>Toca el botón <strong>Compartir</strong> (cuadrado con flecha)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="bg-blue-200 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                                        <span>Desplázate y toca <strong>"Añadir a Inicio"</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="bg-blue-200 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                                        <span>Toca <strong>"Añadir"</strong> para confirmar</span>
                                    </li>
                                </ol>
                            </div>

                            <p className="text-xs text-gray-500 text-center">
                                Esto es necesario para recibir notificaciones en iOS
                            </p>
                        </>
                    ) : (
                        // Android/Desktop with native prompt
                        <>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Smartphone size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Acceso Rápido</h3>
                                        <p className="text-sm text-gray-600">
                                            Abre MI PANA directamente desde tu pantalla de inicio.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Bell size={20} className="text-cyan-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                                        <p className="text-sm text-gray-600">
                                            Recibe alertas de tus viajes incluso con la app cerrada.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {deferredPrompt ? (
                                <Button fullWidth onClick={handleInstall}>
                                    <Download size={18} />
                                    Instalar Ahora
                                </Button>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-xl text-center">
                                    <p className="text-sm text-gray-600">
                                        Usa el menú de tu navegador para instalar la app
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    <button
                        onClick={handleDismiss}
                        className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2"
                    >
                        Ahora no
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
