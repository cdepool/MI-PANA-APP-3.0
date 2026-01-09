
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
  const [role, setRole] = useState<UserRole | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!role) {
    return (
      <div className="min-h-screen bg-[#001529] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-8 animate-bounce-in relative overflow-hidden">

          {/* Logo Section */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg z-10 relative">
                <img
                  src="/logo-pin.png"
                  onError={(e) => e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/929/929426.png"} // Fallback pin icon
                  alt="Mi Pana Pin"
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-[900] text-[#002855] tracking-tight mb-1">¡HOLA MI PANA!</h1>
            <p className="text-[#0099CC] font-bold tracking-[0.15em] text-xs">SIEMPRE CONECTADO</p>
          </div>

          {/* Action Text */}
          <p className="text-center text-gray-500 mb-6 text-sm">
            Selecciona tu perfil para ingresar
          </p>

          {/* Buttons Stack */}
          <div className="space-y-4">
            <button
              onClick={() => setRole(UserRole.PASSENGER)}
              className="w-full py-3.5 px-4 bg-[#0088CC] hover:bg-[#0077b5] text-white rounded-xl font-bold text-lg shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <User size={20} />
              Soy Pasajero
            </button>

            <button
              onClick={() => setRole(UserRole.DRIVER)}
              className="w-full py-3.5 px-4 bg-white border-2 border-[#0088CC] text-[#0088CC] hover:bg-blue-50 rounded-xl font-bold text-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Car size={20} />
              Soy Conductor (Pana)
            </button>

            <button
              onClick={() => setRole(UserRole.ADMIN)}
              className="w-full py-3.5 px-4 bg-[#506679] hover:bg-[#405261] text-white rounded-xl font-bold text-lg shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Shield size={20} />
              Administrador
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center space-y-4">
            <div className="text-sm text-gray-500">
              ¿No tienes cuenta?
            </div>
            <button
              onClick={onNavigateRegister}
              className="text-[#0088CC] font-bold text-lg hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              Crear Cuenta Nueva <ArrowRight size={18} />
            </button>

            <div className="pt-8 text-[10px] text-gray-400">
              © 2025 Mi Pana App. Acarigua - Araure.
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mipana-lightGray dark:bg-[#011836] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-slide-up">
        <button
          onClick={() => setRole(null)}
          className="text-sm text-gray-500 hover:text-mipana-mediumBlue mb-6 flex items-center gap-1"
        >
          ← Volver a selección
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-mipana-darkBlue dark:text-white">
            {role === UserRole.PASSENGER ? 'Hola, Pasajero 👋' :
              role === UserRole.DRIVER ? 'Hola, Conductor 🚗' : 'Panel Admin 🛡️'}
          </h2>
          <p className="text-gray-500 text-sm">Ingresa tus credenciales</p>
        </div>

        {role === UserRole.PASSENGER ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Correo o Teléfono"
              icon={<User size={18} />}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="usuario@ejemplo.com"
            />

            <Input
              label="Contraseña"
              icon={<Lock size={18} />}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isLoading}>
              Ingresar
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">O continúa con</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => googleLogin()}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 p-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('demo.pasajero@mipana.app');
                  setPassword('123456');
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) form.requestSubmit();
                  }, 100);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
              >
                <User size={18} />
                Probar Demo (Pasajero)
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="text-mipana-mediumBlue font-bold hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
          </form>
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