
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { authService } from '../services/authService';

interface LoginProps {
  onNavigateRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateRegister }) => {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (role === UserRole.PASSENGER) {
        // Validate Passenger Credentials (Mock)
        // In a real app, this would verify against backend
        if (identifier && pin === '123456') { // Mock PIN check
          login(role, { email: identifier });
        } else {
          throw new Error("Credenciales inválidas. (Usa PIN 123456 para demo)");
        }
      } else {
        // Driver/Admin login
        login(role);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
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
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
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
      <div className="min-h-screen bg-mipana-lightGray dark:bg-[#011836] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <img src="https://storage.googleapis.com/msgsndr/u0yeLpwH9qH0cMOrw2KP/media/68f4c7a98a42bd7e9f0909b7.png" alt="Mi Pana App" className="h-24 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-mipana-darkBlue dark:text-white">Bienvenido</h1>
            <p className="text-gray-500 mt-2">Selecciona tu perfil para ingresar</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setRole(UserRole.PASSENGER)}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-mipana-mediumBlue flex items-center justify-between group"
            >
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Pasajero</h3>
                <p className="text-sm text-gray-500">Solicita viajes y envíos</p>
              </div>
              <ArrowRight className="text-mipana-mediumBlue opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => setRole(UserRole.DRIVER)}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-mipana-yellow flex items-center justify-between group"
            >
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Conductor</h3>
                <p className="text-sm text-gray-500">Gana dinero conduciendo</p>
              </div>
              <ArrowRight className="text-mipana-yellow opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button
              onClick={() => setRole(UserRole.ADMIN)}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 border-red-500 flex items-center justify-between group"
            >
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Administrador</h3>
                <p className="text-sm text-gray-500">Gestión de flota y usuarios</p>
              </div>
              <ArrowRight className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
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
              label="PIN de Seguridad"
              icon={<Lock size={18} />}
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="******"
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
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 p-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
              Google
            </button>

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