
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { User, Lock, ArrowRight, AlertCircle, Car, Shield, MapPin, Star, Smartphone, LogIn, UserPlus } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { isDriverDomain, isAdminDomain } from '../utils/domain';

interface LoginProps {
  onNavigateRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateRegister }) => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSecurityModal, setShowSecurityModal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Security: Enforce URL param pattern and clean URL
  useEffect(() => {
    // Mimic the bank's security param pattern ?p=1 to look "official"
    const params = new URLSearchParams(window.location.search);
    if (!params.get('p')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('p', '1');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-mipana-darkBlue"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div></div>;

  const handleLogin = async () => {
    if (!phoneOrEmail) {
      toast.error("Por favor ingresa tu celular o correo");
      return;
    }
    if (!password) {
      toast.error("Por favor ingresa tu contraseña");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await authService.loginWithPassword(phoneOrEmail, password);
      toast.success("¡Bienvenido de vuelta! 🚕");
    } catch (err: any) {
      console.error(err);
      setError("Credenciales incorrectas. Verifica tus datos.");
      toast.error("Error al ingresar");
    } finally {
      setIsLoading(false);
    }
  };

  const currentDomain = isDriverDomain() ? 'https://chofer.mipana.app' : 'https://v1.mipana.app';

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-[#0F172A] text-[#1A2E56] dark:text-slate-100 flex flex-col justify-between p-6 relative">
      <div className="h-4"></div>

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all scale-100 border-t-4 border-[#FF6B00]">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="text-red-600 dark:text-red-500" size={32} />
            </div>

            <h3 className="text-xl font-black text-[#1A2E56] dark:text-white mb-2 uppercase tracking-tight">
              No caigas en trampas
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">
              Revisa desde la barra de tu navegador que esta página sea:
            </p>

            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 mb-6 border border-slate-200 dark:border-slate-700">
              <p className="font-mono text-sm text-[#FF6B00] font-bold break-all">
                {currentDomain}/?p=1
              </p>
            </div>

            <button
              onClick={() => setShowSecurityModal(false)}
              className="w-full bg-[#1A2E56] hover:bg-[#2a4580] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#1A2E56]/20"
            >
              OK, Entendido
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full animate-fade-in">
        {/* Logo Section */}
        <div className="mb-6 flex flex-col items-center animate-slide-up">
          <img src="/login-logo.png" alt="Mi Pana Logo" className="w-32 h-32 object-contain drop-shadow-xl" />
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1 text-[#1A2E56] dark:text-white">
            {isDriverDomain() ? 'Panel de Conductor' : '¡Hola de nuevo!'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Ingresa con tu cuenta para continuar
          </p>
        </div>

        {/* Form Section */}
        <div className="w-full space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#1A2E56]/60 dark:text-slate-400 ml-1 uppercase">Usuario (Teléfono o Email)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="text-[#1A2E56]/40 dark:text-white/40" size={20} />
              </div>
              <input
                className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#1A2E56] dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FF6B00] outline-none font-medium text-lg transition-all"
                placeholder="04120000000 o correo"
                type="text"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#1A2E56]/60 dark:text-slate-400 ml-1 uppercase">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-[#1A2E56]/40 dark:text-white/40" size={20} />
              </div>
              <input
                className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#1A2E56] dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FF6B00] outline-none font-medium text-lg transition-all"
                placeholder="********"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center font-bold px-4">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-[#FF6B00] hover:bg-[#e66000] active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#FF6B00]/20 transition-all flex items-center justify-center text-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Ingresar"
            )}
          </button>

          <div className="pt-4 text-center">
            <p className="text-sm text-slate-500">¿No tienes cuenta?</p>
            <button
              onClick={onNavigateRegister}
              className="text-[#FF6B00] font-bold hover:underline mt-1"
            >
              Regístrate aquí
            </button>
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-8 pb-4 text-center">
        <div className="mt-6 mx-auto w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
      </footer>
    </div>
  );
};

export default Login;