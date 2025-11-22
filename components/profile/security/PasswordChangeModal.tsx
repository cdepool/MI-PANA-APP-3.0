import React, { useState } from 'react';
import { X, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import Button from '../../Button';
import OtpInput from '../../OtpInput';
import { pinSchema, pinChangeSchema, validateWithSchema } from '../../../utils/validationSchemas';
import { authService } from '../../../services/authService';
import { passengerService } from '../../../services/passengerService';
import { toast } from 'sonner';

interface PasswordChangeModalProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
    userId,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isChanging, setIsChanging] = useState(false);
    const [showPins, setShowPins] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    if (!isOpen) return null;

    const validatePin = (pin: string, field: string): boolean => {
        const result = validateWithSchema(pinSchema, pin);

        if (!result.success && result.errors) {
            setErrors(prev => ({ ...prev, [field]: Object.values(result.errors!)[0] }));
            return false;
        }

        // Clear error
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });

        return true;
    };

    const handleSubmit = async () => {
        // Reset errors
        setErrors({});

        // Validate all fields
        const validation = validateWithSchema(pinChangeSchema, {
            currentPin,
            newPin,
            confirmPin,
        });

        if (!validation.success && validation.errors) {
            setErrors(validation.errors);
            return;
        }

        setIsChanging(true);

        try {
            // Get current user
            const users = JSON.parse(localStorage.getItem('mipana_db_users') || '[]');
            const user = users.find((u: any) => u.id === userId);

            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Verify current PIN
            if (user.pin !== currentPin) {
                throw new Error('PIN actual incorrecto');
            }

            // Update PIN
            user.pin = newPin;
            user.lastPasswordChange = new Date();

            // Save
            localStorage.setItem('mipana_db_users', JSON.stringify(users));

            toast.success('PIN actualizado exitosamente. Por favor, inicia sesión nuevamente.');

            // Log access
            await passengerService.logAccess(userId, 'PASSWORD_CHANGE', true);

            // Close modal
            if (onSuccess) {
                onSuccess();
            }

            // Logout user (force re-login)
            setTimeout(() => {
                authService.logout();
                window.location.reload();
            }, 1500);

        } catch (error: any) {
            toast.error(error.message || 'Error al cambiar el PIN');
        } finally {
            setIsChanging(false);
        }
    };

    const getPinStrength = (pin: string): { strength: number; label: string; color: string } => {
        if (pin.length < 4) return { strength: 0, label: '', color: '' };

        let strength = 0;

        // Check for sequential
        const isSequential = /0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210/.test(pin);
        if (!isSequential) strength += 1;

        // Check for repetitive
        const isRepetitive = /^(\d)\1{3}$/.test(pin);
        if (!isRepetitive) strength += 1;

        // Check for variety
        const uniqueDigits = new Set(pin.split('')).size;
        if (uniqueDigits >= 3) strength += 1;

        if (strength === 0) return { strength: 1, label: 'Muy débil', color: 'bg-red-500' };
        if (strength === 1) return { strength: 33, label: 'Débil', color: 'bg-orange-500' };
        if (strength === 2) return { strength: 66, label: 'Buena', color: 'bg-yellow-500' };
        return { strength: 100, label: 'Excelente', color: 'bg-green-500' };
    };

    const pinStrength = getPinStrength(newPin);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        Cambiar PIN de Seguridad
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Current PIN */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        PIN Actual
                    </label>
                    <div className="relative">
                        <input
                            type={showPins.current ? 'text' : 'password'}
                            value={currentPin}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                setCurrentPin(value);
                            }}
                            maxLength={4}
                            placeholder="••••"
                            className={`w-full px-4 py-2 pr-10 border rounded-lg dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest ${errors.currentPin ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPins(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                            {showPins.current ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.currentPin && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.currentPin}
                        </p>
                    )}
                </div>

                {/* New PIN */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nuevo PIN
                    </label>
                    <div className="relative">
                        <input
                            type={showPins.new ? 'text' : 'password'}
                            value={newPin}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                setNewPin(value);
                                if (value.length === 4) {
                                    validatePin(value, 'newPin');
                                }
                            }}
                            maxLength={4}
                            placeholder="••••"
                            className={`w-full px-4 py-2 pr-10 border rounded-lg dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest ${errors.newPin ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPins(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                            {showPins.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.newPin && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.newPin}
                        </p>
                    )}

                    {/* Strength Indicator */}
                    {newPin.length === 4 && !errors.newPin && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400">Seguridad</span>
                                <span className="text-xs font-medium">{pinStrength.label}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full transition-all ${pinStrength.color}`}
                                    style={{ width: `${pinStrength.strength}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Confirm PIN */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirmar Nuevo PIN
                    </label>
                    <div className="relative">
                        <input
                            type={showPins.confirm ? 'text' : 'password'}
                            value={confirmPin}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                setConfirmPin(value);
                            }}
                            maxLength={4}
                            placeholder="••••"
                            className={`w-full px-4 py-2 pr-10 border rounded-lg dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest ${errors.confirmPin ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPins(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                            {showPins.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.confirmPin && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} />
                            {errors.confirmPin}
                        </p>
                    )}
                    {newPin === confirmPin && confirmPin.length === 4 && !errors.newPin && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Check size={12} />
                            Los PINs coinciden
                        </p>
                    )}
                </div>

                {/* Requirements */}
                <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Requisitos del PIN:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Exactamente 4 dígitos numéricos</li>
                        <li>• No puede ser secuencial (1234, 4321)</li>
                        <li>• No puede tener todos los dígitos iguales (1111)</li>
                        <li>• Debe ser diferente al PIN actual</li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        fullWidth
                        disabled={isChanging}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        fullWidth
                        disabled={isChanging || !currentPin || !newPin || !confirmPin}
                    >
                        {isChanging ? 'Cambiando...' : 'Cambiar PIN'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PasswordChangeModal;
