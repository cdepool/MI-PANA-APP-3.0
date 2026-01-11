
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
import { isDriverDomain } from '../utils/domain';

interface LoginProps {
  onNavigateRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateRegister }) => {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-mipana-darkBlue"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div></div>;

  const handleImplicitLogin = async () => {
    if (phone.length < 10) {
      toast.error("Por favor completa tu número de celular");
      return;
    }

    if (mode === 'REGISTER' && !name) {
      toast.error("Por favor ingresa tu nombre");
      return;
    }

    setIsLoading(true);
    try {
      const derivedEmail = `${phone}@mipana.app`;
      await authService.registerOrLoginImplicit(derivedEmail, undefined, name || 'Usuario Pana', phone);
      toast.success(mode === 'REGISTER' ? "¡Registro exitoso! 🚕" : "¡Bienvenido de vuelta! 🚕");
      // navigate('/') will be handled by useEffect [isAuthenticated]
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Error al ingresar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-[#0F172A] text-[#1A2E56] dark:text-slate-100 flex flex-col justify-between p-6">
      <div className="h-4"></div>

      <main className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full animate-fade-in">
        {/* Logo Section */}
        <div className="mb-6 flex flex-col items-center animate-slide-up">
          <img src="/login-logo.png" alt="Mi Pana Logo" className="w-32 h-32 object-contain drop-shadow-xl" />
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex w-full bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 mb-8 shadow-inner">
          <button
            onClick={() => setMode('REGISTER')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${mode === 'REGISTER' ? 'bg-white dark:bg-slate-700 shadow-md text-[#FF6B00]' : 'text-slate-400'}`}
          >
            <UserPlus size={18} />
            Registro
          </button>
          <button
            onClick={() => setMode('LOGIN')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${mode === 'LOGIN' ? 'bg-white dark:bg-slate-700 shadow-md text-[#FF6B00]' : 'text-slate-400'}`}
          >
            <LogIn size={18} />
            Entrar
          </button>
        </div>


        {/* Welcome Text */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1 text-[#1A2E56] dark:text-white">
            {isDriverDomain()
              ? (mode === 'REGISTER' ? '¡Únete como Conductor!' : 'Panel de Conductor')
              : (mode === 'REGISTER' ? '¡Quiero ser Pana!' : '¡Hola de nuevo!')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isDriverDomain()
              ? (mode === 'REGISTER' ? 'Regístrate para empezar a generar' : 'Ingresa para gestionar tu jornada')
              : (mode === 'REGISTER' ? 'Únete a la mejor comunidad de viajes' : 'Ingresa tu número para continuar')}
          </p>
        </div>

        {/* Form Section */}
        <div className="w-full space-y-4">
          {mode === 'REGISTER' && (
            <div className="space-y-1 animation-slide-down">
              <label className="block text-xs font-bold text-[#1A2E56]/60 dark:text-slate-400 ml-1 uppercase">Tu Nombre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="text-[#1A2E56]/40 dark:text-white/40" size={20} />
                </div>
                <input
                  className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#1A2E56] dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FF6B00] outline-none font-medium text-lg transition-all"
                  placeholder="Ej: Juan Pérez"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#1A2E56]/60 dark:text-slate-400 ml-1 uppercase">Teléfono (WhatsApp)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Smartphone className="text-[#1A2E56]/40 dark:text-white/40" size={20} />
              </div>
              <input
                className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#1A2E56] dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#FF6B00] outline-none font-medium text-lg transition-all"
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
            className="w-full bg-[#FF6B00] hover:bg-[#e66000] active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#FF6B00]/20 transition-all flex items-center justify-center text-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              mode === 'REGISTER' ? "Comenzar Registro" : "Acceso Directo"
            )}
          </button>
        </div>
      </main>

      <footer className="mt-auto pt-8 pb-4 text-center">
        <div className="mt-6 mx-auto w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
      </footer>
    </div>
  );
};

export default Login;