
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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to handle browser navigation (optional, if using client-side routing for sub-paths)
  React.useEffect(() => {
    setRole(getInitialRole());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setIsLoading(true);
    setError(null);

    try {
      // Real Login for ALL roles (Passenger, Driver, Admin)
      // The backend (Supabase) verifies credentials and returns the profile
      await loginPassenger(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      toast.error(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
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
          <div className="space-y-6">

            {/* Phone Login Button (Primary) */}
            <Button
              onClick={onNavigateRegister}
              fullWidth
              size="lg"
              className="bg-mipana-mediumBlue hover:bg-[#007EA3]"
            >
              <div className="flex items-center gap-3">
                <div className="p-1 bg-white/20 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
                </div>
                <span className="text-lg">Ingresar con Celular</span>
              </div>
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">O</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={() => authService.loginWithGoogle()}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 p-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
              <span>Continuar con Google</span>
            </button>

            <p className="text-center text-xs text-gray-400 mt-6">
              Al ingresar aceptas nuestros <a href="#" className="underline hover:text-mipana-mediumBlue">Términos y Condiciones</a>.
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