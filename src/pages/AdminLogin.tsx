import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// ... imports

// Debug Component
const DebugStatus = () => {
    const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
    const [msg, setMsg] = useState('Verificando conexión...');
    const [details, setDetails] = useState('');

    React.useEffect(() => {
        const check = async () => {
            try {
                if (!navigator.onLine) throw new Error("Sin conexión a internet");

                // Check if Env Vars are loaded
                const url = import.meta.env.VITE_SUPABASE_URL;
                if (!url) throw new Error("Falta VITE_SUPABASE_URL");

                // Check Supabase Connectivity
                const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);

                if (error) {
                    if (error.message.includes('fetch')) throw new Error("Error de red al contactar Supabase");
                    // Postgrest error means we connected but maybe table blocked, which is fine for connectivity check
                }

                setStatus('ok');
                setMsg('Sistema Operativo');
                setDetails(url.substring(0, 15) + '...');
            } catch (e: any) {
                setStatus('error');
                setMsg('Error de Sistema');
                setDetails(e.message);
            }
        };
        check();
    }, []);

    return (
        <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur text-white p-3 rounded-lg text-xs font-mono border border-white/10 max-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${status === 'ok' ? 'bg-green-500' : status === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="font-bold">{msg}</span>
            </div>
            {details && <div className="text-white/50 break-all">{details}</div>}
        </div>
    );
};

const AdminLogin: React.FC = () => {
    // ... existing code ...
    return (
        <div className="min-h-screen bg-[#001F3F] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* ... backgrounds ... */}

            <DebugStatus />

            <div className="w-full max-w-md z-10">
                {/* ... rest of UI ... */}
                console.log("Iniciando signInWithPassword...");

                const {data, error} = await withTimeout(
                supabase.auth.signInWithPassword({email, password}),
                10000,
                "Autenticación"
                );

                if (error) throw error;
                console.log("SignIn exitoso:", data.user?.id);

                toast.dismiss();
                toast.loading("Datos correctos. Verificando permisos...");

                if (data.user) {
                    console.log("Consultando perfil...");
                const {data: profile, error: profileError } = await withTimeout(
                supabase
                .from('profiles')
                .select('role, admin_role')
                .eq('id', data.user.id)
                .single(),
                10000,
                "Consulta de Perfil"
                );

                if (profileError) {
                    console.error('Error fetching profile:', profileError);
                throw new Error('No se pudo verificar el perfil del administrador: ' + profileError.message);
                }
                console.log("Perfil obtenido:", profile);

                if (profile?.role !== 'ADMIN' && !profile?.admin_role) {
                    await supabase.auth.signOut();
                throw new Error('Esta cuenta no tiene privilegios administrativos.');
                }

                toast.dismiss();
                toast.success("Bienvenido al Panel Corporativo");
                setTimeout(() => navigate('/admin'), 500);
            }
        } catch (err: any) {
                    console.error('Login Error Trap:', err);
                toast.dismiss();
                toast.error(err.message || 'Error desconocido');
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
                            onClick={() => navigate('/login')}
                            className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors text-sm font-medium"
                        >
                            <ArrowLeft size={16} />
                            Volver al inicio
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
