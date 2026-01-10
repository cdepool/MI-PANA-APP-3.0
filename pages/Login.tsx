
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { User, Lock, ArrowRight, AlertCircle, Car, Shield } from 'lucide-react';
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
    <div className="min-h-screen bg-white flex flex-col justify-between">

      {/* 1. Header & Hero Area */}
      <div className="relative bg-slate-900 pb-16 rounded-b-[40%] shadow-2xl overflow-hidden">
        {/* Status Bar Indicator (Visual only) */}
        <div className="flex justify-between items-center px-6 py-3 text-white/50 text-xs">
          <span>9:41</span>
          <div className="flex gap-2">
            <div className="w-4 h-4 bg-current rounded-full opacity-20"></div>
            <div className="w-4 h-4 bg-current rounded-full opacity-20"></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="flex flex-col items-center pt-4 pm-10">
          {/* Green Car Placeholder/Icon if image missing */}
          <div className="w-48 h-32 flex items-center justify-center relative z-10 animate-slide-up">
            {/* Using SVG or Image. Using a Car Icon for now styled as requested */}
            <div className="w-32 h-32 bg-lime-500 rounded-full flex items-center justify-center shadow-lg shadow-lime-500/20">
              <Car size={64} className="text-white transform -scale-x-100" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="flex-1 px-6 pt-12 flex flex-col items-center animate-fade-in text-center">
        <h1 className="text-2xl text-slate-900 leading-tight">
          ¡A donde quieras ir<br />
          <span className="font-bold text-3xl block mt-1">Vamos!</span>
        </h1>

        <div className="w-full mt-10 space-y-6">

          {/* Phone Input Group */}
          <div className="relative flex items-center">
            <div className="absolute left-4 z-10 pointer-events-none">
              <span className="font-bold text-slate-900 text-lg">+58</span>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Ingrese número de teléfono"
              className="w-full h-14 pl-16 pr-4 bg-white border border-slate-200 rounded-full text-lg shadow-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Optional Name for New Users (Hidden by default in strictly phone-only visual, but useful for logic) */}
          {/* We will hide it to strictly follow the visual request "Input campo: Ingrese numero de telefono". 
                Backend handles name update later or we default it. */}

          <button
            onClick={handleImplicitLogin}
            disabled={isLoading || phone.length < 10}
            className="w-full h-14 bg-slate-900 text-white font-medium rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Verificar número"
            )}
          </button>
        </div>
      </div>

      {/* 3. Footer */}
      <div className="p-6 text-center">
        <p className="text-xs text-slate-400">
          Al continuar aceptas los <span className="font-bold text-slate-500">Términos y Condiciones</span>
        </p>
      </div>

    </div>
  );
};

export default Login;