import React, { useState } from 'react';
import { X, Mail, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../services/authService';

interface ForgotPasswordProps {
    isOpen: boolean;
    onClose: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.includes('@')) {
            toast.error('Por favor ingresa un email válido');
            return;
        }

        setIsLoading(true);
        try {
            await authService.requestPasswordReset(email);
            setEmailSent(true);
            toast.success('Email enviado correctamente');
        } catch (error: any) {
            toast.error(error.message || 'Error al enviar el email de recuperación');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setEmailSent(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative transform transition-all scale-100">
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X size={24} />
                </button>

                {!emailSent ? (
                    <>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#FF6B00]/10 rounded-full">
                                <Mail className="text-[#FF6B00]" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#1A2E56] dark:text-white">
                                    Recuperar Contraseña
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Te enviaremos un enlace de recuperación
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#1A2E56]/60 dark:text-slate-400 ml-1 uppercase mb-2">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#1A2E56] dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FF6B00] outline-none font-medium transition-all"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full bg-[#FF6B00] hover:bg-[#e66000] active:scale-[0.98] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#FF6B00]/20 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={20} />
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar Enlace de Recuperación'
                                )}
                            </button>
                        </form>

                        <button
                            onClick={handleClose}
                            className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                    </>
                ) : (
                    <div className="text-center py-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="text-green-600 dark:text-green-500" size={32} />
                        </div>

                        <h3 className="text-xl font-bold text-[#1A2E56] dark:text-white mb-2">
                            ¡Email Enviado!
                        </h3>

                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                            Hemos enviado un enlace de recuperación a <strong>{email}</strong>.
                            <br />
                            Revisa tu bandeja de entrada y sigue las instrucciones.
                        </p>

                        <button
                            onClick={handleClose}
                            className="w-full bg-[#1A2E56] hover:bg-[#2a4580] text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                        >
                            Entendido
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
