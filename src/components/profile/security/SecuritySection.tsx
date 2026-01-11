import React, { useState } from 'react';
import { Shield, Key, Image as ImageIcon, Smartphone, Lock } from 'lucide-react';
import Button from '../../Button';
import PasswordChangeModal from './PasswordChangeModal';
import AccessHistoryTable from './AccessHistoryTable';

interface SecuritySectionProps {
    userId: string;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({ userId }) => {
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Mock security image selection
    const securityImages = [
        { id: '1', emoji: '🏠', label: 'Casa' },
        { id: '2', emoji: '🐕', label: 'Perro' },
        { id: '3', emoji: '🚗', label: 'Carro' },
        { id: '4', emoji: '⚽', label: 'Fútbol' },
        { id: '5', emoji: '🎵', label: 'Música' },
        { id: '6', emoji: '🌴', label: 'Palmera' },
    ];

    const [selectedSecurityImage, setSelectedSecurityImage] = useState('1');

    return (
        <div className="space-y-6">
            {/* Security Actions Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Shield size={20} className="text-mipana-mediumBlue" />
                    Configuración de Seguridad
                </h3>

                <div className="space-y-4">
                    {/* Change PIN */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-mipana-mediumBlue/10 rounded-lg">
                                <Key size={20} className="text-mipana-mediumBlue" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800 dark:text-white">
                                    PIN de Seguridad
                                </p>
                                <p className="text-xs text-gray-500">
                                    Último cambio: Hace 30 días
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowPasswordModal(true)}
                            variant="outline"
                        >
                            Cambiar
                        </Button>
                    </div>

                    {/* Security Image */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <ImageIcon size={20} className="text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800 dark:text-white">
                                    Imagen de Seguridad
                                </p>
                                <p className="text-xs text-gray-500">
                                    Se mostrará al iniciar sesión para verificar autenticidad
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-6 gap-2">
                            {securityImages.map((img) => (
                                <button
                                    key={img.id}
                                    onClick={() => setSelectedSecurityImage(img.id)}
                                    className={`
                    p-3 rounded-lg border-2 transition-all
                    ${selectedSecurityImage === img.id
                                            ? 'border-mipana-mediumBlue bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}
                  `}
                                    title={img.label}
                                >
                                    <span className="text-2xl">{img.emoji}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2FA Status (Future Feature) */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl opacity-60">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Smartphone size={20} className="text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800 dark:text-white">
                                    Autenticación de Dos Factores
                                </p>
                                <p className="text-xs text-gray-500">
                                    Próximamente - Fase 2
                                </p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                            Desactivado
                        </span>
                    </div>
                </div>
            </div>

            {/* Access History */}
            <AccessHistoryTable userId={userId} limit={10} />

            {/* Security Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                        <Lock size={20} className="text-white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-white mb-2">
                            Consejos de Seguridad
                        </h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            <li>• Nunca compartas tu PIN con nadie</li>
                            <li>• Cambia tu PIN regularmente (cada 60-90 días)</li>
                            <li>• No uses PINs secuenciales o repetitivos</li>
                            <li>• Cierra sesión en dispositivos compartidos</li>
                            <li>• Verifica la imagen de seguridad al iniciar sesión</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            <PasswordChangeModal
                userId={userId}
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </div>
    );
};

export default SecuritySection;
