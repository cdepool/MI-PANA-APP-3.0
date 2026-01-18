import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../services/authService';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Check if we have a valid reset token
    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        const type = searchParams.get('type');

        if (!accessToken || type !== 'recovery') {
            toast.error('Enlace de recuperación inválido o expirado');
            setTimeout(() => navigate('/login'), 2000);
        }
    }, [searchParams, navigate]);

    const validatePassword = () => {
        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return false;
        }
        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePassword()) return;

        setIsLoading(true);
        try {
            await authService.updatePassword(password);
            setIsSuccess(true);
            toast.success('¡Contraseña actualizada correctamente!');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-mipana-darkBlue flex items-center justify-center p-6">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="text-green-600 dark:text-green-500" size={32} />
                    </div>

                    <h2 className="text-2xl font-bold text-[#1A2E56] dark:text-white mb-2">
                        ¡Contraseña Actualizada!
                    </h2>

                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                        Tu contraseña ha sido cambiada exitosamente.
                        <br />
                        Redirigiendo al inicio de sesión...
                    </p>

                    <div className="w-12 h-12 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-mipana-darkBlue flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[#FF6B00]/10 rounded-full">
                        <Lock className="text-[#FF6B00]" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#1A2E56] dark:text-white">
                            Nueva Contraseña
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Ingresa tu nueva contraseña
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[#1A2E56]/60 dark:text-slate-400 ml-1 uppercase mb-2">
                            Nueva Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="text-[#1A2E56]/40 dark:text-white/40" size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="block w-full pl-12 pr-12 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#1A2E56] dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FF6B00] outline-none font-medium text-lg transition-all"
                                disabled={isLoading}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#1A2E56]/40 dark:text-white/40 hover:text-[#FF6B00] transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#1A2E56]/60 dark:text-slate-400 ml-1 uppercase mb-2">
                            Confirmar Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="text-[#1A2E56]/40 dark:text-white/40" size={20} />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="block w-full pl-12 pr-12 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#1A2E56] dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FF6B00] outline-none font-medium text-lg transition-all"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#1A2E56]/40 dark:text-white/40 hover:text-[#FF6B00] transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {password && password.length < 6 && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <AlertCircle className="text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-yellow-700 dark:text-yellow-400">
                                La contraseña debe tener al menos 6 caracteres
                            </p>
                        </div>
                    )}

                    {password && confirmPassword && password !== confirmPassword && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle className="text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" size={16} />
                            <p className="text-xs text-red-700 dark:text-red-400">
                                Las contraseñas no coinciden
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !password || !confirmPassword || password !== confirmPassword || password.length < 6}
                        className="w-full bg-[#FF6B00] hover:bg-[#e66000] active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#FF6B00]/20 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Actualizar Contraseña'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
