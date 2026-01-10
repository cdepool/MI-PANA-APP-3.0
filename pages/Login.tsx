
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
    if (!name.trim() || phone.length < 10) {
      toast.error("Por favor completa tu nombre y número válido");
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
    <div className="min-h-screen bg-mipana-lightGray dark:bg-[#011836] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-slide-up">

        {/* Only show "Back" if we are not in the default Passenger view (e.g. debugging) */}
        {role !== UserRole.PASSENGER && (
          <div className="mb-4 text-center text-xs text-orange-500 font-bold border border-orange-200 bg-orange-50 p-2 rounded">
            ⚠️ Modo {role} (Detectado por URL)
          </div>
        )}

        <div className="text-center mb-8">
          {role === UserRole.PASSENGER ? (
            <>
              <h1 className="text-3xl font-[900] text-[#002855] tracking-tight mb-1">¡HOLA MI PANA!</h1>
              <p className="text-[#0099CC] font-bold tracking-[0.15em] text-xs">SIEMPRE CONECTADO</p>
            </>
          ) : (
            <h2 className="text-2xl font-bold text-mipana-darkBlue dark:text-white">
              {role === UserRole.DRIVER ? 'Hola, Conductor 🚗' : 'Panel Admin 🛡️'}
            </h2>
          )}
          <p className="text-gray-500 text-sm mt-2">Ingresa tus credenciales</p>
        </div>

        {role === UserRole.PASSENGER ? (
          <div className="space-y-5">

            <div className="text-left">
              <label className="text-sm font-semibold text-[#002855] ml-1">Tu Nombre</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Carlos"
                className="mt-1"
                icon={<User size={18} className="text-gray-400" />}
              />
            </div>

            <div className="text-left">
              <label className="text-sm font-semibold text-[#002855] ml-1">Número de Celular</label>
              <div className="relative mt-1">
                <div className="absolute left-3 top-3 bg-gray-100 rounded text-xs font-bold px-1 py-0.5 text-gray-500">VE</div>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0412 123 4567"
                  className="pl-12 font-mono text-lg tracking-wide"
                  type="tel"
                  inputMode="numeric"
                  icon={<div className="w-0" />} // Hack to remove default icon space if needed, or just standard input
                />
              </div>
            </div>

            <Button
              onClick={handleImplicitLogin}
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-6 bg-[#FF6B00] hover:bg-[#E65000] text-white font-[900] text-xl shadow-lg shadow-orange-200 transform active:scale-95 transition-all"
            >
              PEDIR TAXI 🚖
            </Button>

            <p className="text-center text-[10px] text-gray-400 mt-4 leading-tight">
              Al usar la app aceptas nuestros <span className="font-bold cursor-pointer">Términos y Condiciones</span> y Política de Privacidad.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-500 italic">
              Simulación de acceso para {role}
            </p>
            <Button onClick={handleLogin} fullWidth isLoading={isLoading}>
              Ingresar Demo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
```