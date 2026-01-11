import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

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
                const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

                if (!url) throw new Error("Falta VITE_SUPABASE_URL");
                if (!key) throw new Error("Falta VITE_SUPABASE_ANON_KEY");

                // Check Supabase Connectivity with a quick fetch to the API
                // This bypasses SDK cache and checks direct network access
                const healthCheck = await Promise.race([
                    fetch(`${url}/rest/v1/`, { method: 'GET', headers: { 'apikey': key } }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout de Red (Supabase)")), 8000))
                ]) as Response;

                if (!healthCheck.ok && healthCheck.status !== 401 && healthCheck.status !== 404) {
                    throw new Error(`Error de Red: Status ${healthCheck.status}`);
                }

                setStatus('ok');
                setMsg('Sistema Conectado');
                setDetails(`${url.substring(0, 20)}...`);
            } catch (e: any) {
                console.error("Debug Check Failed:", e);
                setStatus('error');
                setMsg('Falla de Conexión');
                setDetails(e.message);
            }
        };
        check();
    }, []);

    return (
        <div className="fixed bottom-4 right-4 bg-black/90 backdrop-blur-xl text-white p-4 rounded-xl text-[10px] font-mono border border-white/10 max-w-[240px] shadow-2xl z-[100]">
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'ok' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : status === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                <span className="font-bold tracking-tight uppercase">{msg}</span>
            </div>
            {details && <div className="text-white/40 break-all bg-white/5 p-2 rounded-md border border-white/5">{details}</div>}
            <div className="mt-2 text-[9px] text-white/20 italic">V4-PROD-DIAGNOSTIC</div>
        </div>
    );
};

const AdminLogin: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        toast.dismiss();

        // Helper to timeout promises - Increased for production reliability
        const withTimeout = (promise: Promise<any>, ms: number, label: string) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} excedió el tiempo de espera (${ms}ms). Verifique su conexión.`)), ms))
            ]);
        };

        try {
            toast.loading("Verificando credenciales corporativas...");
            console.log("Iniciando signInWithPassword a 20s timeout...");

            const { data, error } = await withTimeout(
                supabase.auth.signInWithPassword({ email, password }),
                20000,
                "Autenticación"
            );

            if (error) {
                console.error("Auth Error:", error);
                throw error;
            }

            console.log("SignIn exitoso:", data.user?.id);

            toast.dismiss();
            toast.loading("Permisos encontrados. Verificando rol...");

            if (data.user) {
                console.log("Consultando perfil con 15s timeout...");
                const { data: profile, error: profileError } = await withTimeout(
                    supabase
                        .from('profiles')
                        .select('role, admin_role')
                        .eq('id', data.user.id)
                        .single(),
                    15000,
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

            <DebugStatus />

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
