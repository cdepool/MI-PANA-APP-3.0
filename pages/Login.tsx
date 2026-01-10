
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { User, Lock, ArrowRight, AlertCircle, Car, Shield, MapPin, Star, Phone } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { authService } from '../services/authService';

interface LoginProps {
  onNavigateRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateRegister }) => {
  const { login, loginPassenger } = useAuth();

  // Auto-detect role based on subdomain or path
  const getInitialRole = (): UserRole => {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    if (hostname.includes('admin') || pathname.startsWith('/admin')) {
      return UserRole.ADMIN;
    }
    if (hostname.includes('driver') || hostname.includes('conductor') || pathname.startsWith('/driver')) {
      return UserRole.DRIVER;
    }
    // Default to PASSENGER for v1.mipana.app and main localhost
    return UserRole.PASSENGER;
  };

  const [role, setRole] = useState<UserRole>(getInitialRole());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to handle browser navigation (optional, if using client-side routing for sub-paths)
  React.useEffect(() => {
    setRole(getInitialRole());
  }, []);

  const handleImplicitLogin = async () => {
    if (phone.length < 10) {
      toast.error("Por favor completa tu número de celular");
      return;
    }

    setIsLoading(true);
    try {
      // "Zero Friction" Logic (Client Side for now, soon to be Edge Function)
      const user = await authService.registerOrLoginImplicit(name, phone);
      login(UserRole.PASSENGER, user);
      toast.success("¡Vamos! 🚕");
      // Navigation is automatic via AuthContext or can be forced if needed
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Error al ingresar');
    } finally {
      setIsLoading(false);
    }
  };

  // Legacy handleLogin removed/ignored for Passenger
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Admin/Driver logic remains if needed later
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        // Fetch user info using the access token
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        // Log in the user with the Google profile and access token
        login(UserRole.PASSENGER, {
          email: userInfo.email,
          name: `${userInfo.given_name} ${userInfo.family_name}`,
          googleAccessToken: tokenResponse.access_token // Store token for Calendar/Tasks
        });

        toast.success(`Bienvenido, ${userInfo.given_name}!`);
      } catch (error) {
        console.error(error);
        toast.error("Error al iniciar sesión con Google");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error("Falló el inicio de sesión con Google");
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly'
  });

  // No more "if (!role) return ..." block. DIRECT ACCESS.

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-[#0F172A] text-[#1A2E56] dark:text-slate-100 flex flex-col justify-between p-6">

      {/* Spacer */}
      <div className="h-4"></div>

      <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full animate-fade-in">

        {/* Logo Section */}
        <div className="mb-12 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="flex items-center justify-center relative">
              {/* Main Logo Circle (Dark Blue) */}
              <div className="w-16 h-16 rounded-full bg-[#1A2E56] flex items-center justify-center shadow-lg z-20">
                <MapPin className="text-white transform -rotate-12" size={32} strokeWidth={2.5} />
              </div>
              {/* Star Badge (Orange) */}
              <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#FF6B00] flex items-center justify-center shadow-md z-10">
                <Star className="text-white" size={20} fill="currentColor" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-[#1A2E56] dark:text-white leading-none">
              MI PANA
            </h1>
            <div className="text-xl font-extrabold text-[#FF6B00] tracking-[0.2em] mt-1">APP</div>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2 text-[#1A2E56] dark:text-white">Bienvenido</h2>
          <p className="text-slate-500 dark:text-slate-400">Inicia sesión para continuar</p>
        </div>

        {/* Form Section */}
        <div className="w-full space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1A2E56] dark:text-slate-300 ml-1">Número telefónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="text-[#1A2E56]/40 dark:text-white/40" size={24} />
              </div>
              <input
                className="block w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#1A2E56] dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent transition-all outline-none font-medium text-lg"
                placeholder="0412 000 0000"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleImplicitLogin()}
              />
            </div>
          </div>

          <button
            onClick={handleImplicitLogin}
            disabled={isLoading}
            className="w-full bg-[#FF6B00] hover:bg-[#e66000] active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#FF6B00]/20 transition-all flex items-center justify-center text-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Continuar"
            )}
          </button>
        </div>

        {/* Register Link (Optional based on design, user kept it in template) */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            ¿No tienes cuenta?
            <span className="text-[#1A2E56] dark:text-[#FF6B00] font-bold cursor-pointer ml-1" onClick={handleImplicitLogin}>Regístrate aquí</span>
          </p>
        </div>

      </main>

      <footer className="mt-auto pt-8 pb-4 text-center">
        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium tracking-wide">
          Venezuela en <span className="text-[#1A2E56] dark:text-slate-300 font-bold">Movimiento</span>
          <br />
          <span className="text-[#FF6B00] font-bold italic">"Siempre Conectado"</span>
        </p>
        {/* Native Home Indicator simulation */}
        <div className="mt-6 mx-auto w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
      </footer>

    </div>
  );
};

export default Login;