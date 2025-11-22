import React, { useState } from 'react';
import { X, User, Mail, Lock, Shield, Car, AlertCircle, CheckCircle } from 'lucide-react';
import { UserRole, AdminRole } from '../../types';
import { authService } from '../../services/authService';
import Button from '../Button';
import Input from '../Input';
import { toast } from 'sonner';

interface AdminUserCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminUserCreationModal: React.FC<AdminUserCreationModalProps> = ({ isOpen, onClose }) => {
    const [role, setRole] = useState<UserRole>(UserRole.PASSENGER);
    const [adminRole, setAdminRole] = useState<AdminRole>(AdminRole.SUPPORT);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Or PIN
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                name,
                email,
                password,
                role,
                ...(role === UserRole.ADMIN ? { adminRole } : {})
            };

            const result = await authService.adminCreateUser(payload);

            if (result.success) {
                toast.success(result.message);
                onClose();
                // Reset form
                setName('');
                setEmail('');
                setPassword('');
                setRole(UserRole.PASSENGER);
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al crear usuario');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <User size={24} className="text-mipana-mediumBlue" />
                            Crear Nuevo Usuario
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Añade usuarios manualmente al sistema
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Role Selection */}
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole(UserRole.PASSENGER)}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${role === UserRole.PASSENGER
                                    ? 'border-mipana-mediumBlue bg-blue-50 dark:bg-blue-900/20 text-mipana-mediumBlue'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-500'
                                    }`}
                            >
                                <User size={24} />
                                <span className="text-xs font-bold">Pasajero</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole(UserRole.DRIVER)}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${role === UserRole.DRIVER
                                    ? 'border-mipana-yellow bg-yellow-50 dark:bg-yellow-900/20 text-mipana-yellow'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-500'
                                    }`}
                            >
                                <Car size={24} />
                                <span className="text-xs font-bold">Conductor</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole(UserRole.ADMIN)}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${role === UserRole.ADMIN
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-500'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-500'
                                    }`}
                            >
                                <Shield size={24} />
                                <span className="text-xs font-bold">Admin</span>
                            </button>
                        </div>

                        {/* Admin Sub-Role */}
                        {role === UserRole.ADMIN && (
                            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 animate-fade-in">
                                <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                                    Nivel de Acceso
                                </label>
                                <select
                                    value={adminRole}
                                    onChange={(e) => setAdminRole(e.target.value as AdminRole)}
                                    className="w-full p-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                                >
                                    <option value={AdminRole.SUPER_ADMIN}>Super Admin (Acceso Total)</option>
                                    <option value={AdminRole.SUPPORT}>Soporte General (Atención al Usuario)</option>
                                    <option value={AdminRole.CONFLICT_RESOLUTION}>Resolución de Conflictos (Disputas)</option>
                                    <option value={AdminRole.SECURITY}>Seguridad (Interdicción y Bloqueos)</option>
                                    <option value={AdminRole.FINANCE}>Finanzas (Pagos y Reembolsos)</option>
                                    <option value={AdminRole.OPERATIONS}>Operaciones (Flota y Viajes)</option>
                                </select>
                            </div>
                        )}

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <Input
                                label="Nombre Completo"
                                placeholder="Ej: Juan Pérez"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                icon={<User size={18} />}
                                required
                            />

                            <Input
                                label="Correo Electrónico"
                                type="email"
                                placeholder="juan@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={<Mail size={18} />}
                                required
                            />

                            <Input
                                label={role === UserRole.ADMIN ? "Contraseña Temporal" : "PIN Inicial (6 dígitos)"}
                                type="password"
                                placeholder="******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={<Lock size={18} />}
                                required
                            />
                        </div>

                        {/* Warning */}
                        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p>
                                El usuario recibirá un correo de bienvenida (simulado) con sus credenciales de acceso.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="pt-2">
                            <Button type="submit" fullWidth isLoading={isLoading}>
                                Crear Usuario
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};
