import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';



const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        toast.dismiss();

        try {
            toast.loading("Verificando acceso corporativo...");

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Tiempo de espera agotado. Verifique su conexión.")), 10000)
            );

            // Race between login and timeout
            const userProfile = await Promise.race([
                authService.loginWithPassword(email, password),
                timeoutPromise
            ]) as any;

            console.log("Admin auth successful:", userProfile.id);

            // ⚡ OPTIMIZATION: Check role directly from the returned profile (already in metadata)
            // No secondary fetch needed!
            if (userProfile.role !== 'ADMIN' && !(userProfile as any).admin_role) {
                // Secondary check: If metadata is missing (legacy user), ONLY then do a targeted fetch
                // This preserves speed for 99% of cases while ensuring compatibility
                if (!(userProfile as any).admin_role) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role, admin_role')
                        .eq('id', userProfile.id)
                        .single();

                    if (profile?.role !== 'ADMIN' && !profile?.admin_role) {
                        await supabase.auth.signOut();
                        throw new Error('Esta cuenta no tiene privilegios administrativos.');
                    }
                }
            }

            toast.dismiss();
            toast.success("Acceso Concedido. Bienvenido.");

            // ⚡ OPTIMIZATION: Removed 500ms artificial delay. 
            // Immediate navigation provides better perceived performance.
            navigate('/admin');
        } catch (err: any) {
            console.error('Admin Login Error:', err);
            toast.dismiss();
            toast.error(err.message || 'Error de autenticación');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#001F3F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-mipana-gold/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>



            <div className="w-full max-w-md z-10">
                <button
                    onClick={() => {
                        if (window.location.hostname === 'localhost') {
                            navigate('/login');
                        } else {
                            window.location.href = import.meta.env.VITE_APP_URL || 'https://v1.mipana.app';
                        }
                    }}
                    className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    Volver al sitio público
                </button>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="p-4 bg-mipana-gold/10 rounded-full mb-4 border border-mipana-gold/20">
                            <Shield size={32} className="text-mipana-gold" />
                        </div>
                        <h1 className="text-2xl font-bold text-center">Acceso Corporativo</h1>
                        <p className="text-white/50 text-sm mt-2 text-center">Gestión y Administración Centralizada</p>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-mipana-gold uppercase tracking-wider ml-1">Correo Corporativo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="text-white/30" size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-mipana-gold/50 focus:ring-1 focus:ring-mipana-gold/50 transition-all"
                                    placeholder="admin@nexttv.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-mipana-gold uppercase tracking-wider ml-1">Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="text-white/30" size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-mipana-gold/50 focus:ring-1 focus:ring-mipana-gold/50 transition-all"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-mipana-gold hover:bg-[#D4AF37] disabled:opacity-70 disabled:cursor-not-allowed text-[#001F3F] font-bold py-4 rounded-xl shadow-lg shadow-mipana-gold/20 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-[#001F3F]/30 border-t-[#001F3F] rounded-full animate-spin" />
                            ) : (
                                <>
                                    Iniciar Sesión
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-white/30">
                        Acceso restringido. Su dirección IP está siendo monitoreada.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
