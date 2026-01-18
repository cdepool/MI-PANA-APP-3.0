import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { isDriverDomain } from '../utils/domain';
import Button from '../components/Button';
import Input from '../components/Input';
import { authService } from '../services/authService';
import { UserRole } from '../types';
import { ArrowLeft, Smartphone, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { prefetchPage } from '../utils/prefetch';

interface RegisterProps {
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigateHome, onNavigateLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ⚡ OPTIMIZATION: useCallback to prevent re-creation
  const handleSmartSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Inline validation for better UX
    if (!email.includes('@')) {
      toast.error("Por favor ingresa un email válido");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (phone.length < 10) {
      toast.error("Ingresa un número de teléfono válido");
      return;
    }
    if (!name.trim()) {
      toast.error("Por favor ingresa tu nombre");
      return;
    }

    setIsLoading(true);
    try {
      const targetRole = isDriverDomain() || new URLSearchParams(window.location.search).get('role') === 'chofer'
        ? UserRole.DRIVER
        : UserRole.PASSENGER;

      await authService.registerUser({
        email: email.trim(),
        password,
        name: name.trim(),
        phone,
        idType: 'V',
        idNumber: '',
        age: 18,
        role: targetRole
      });

      toast.success("¡Registro exitoso!", {
        description: "Ahora puedes iniciar sesión",
        duration: 3000
      });

      onNavigateLogin();
    } catch (err: any) {
      toast.error(err.message || "Error al registrarse");
    } finally {
      setIsLoading(false);
    }
  }, [email, password, phone, name, onNavigateLogin]);

  return (
    <div className="min-h-screen bg-mipana-lightGray dark:bg-[#011836] flex flex-col items-center justify-center p-6">

      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <img src="/logo-app.png" alt="Mi Pana App" className="h-20 w-auto mx-auto mb-4 drop-shadow-xl" />
          <h1 className="text-2xl font-bold text-mipana-darkBlue dark:text-white">Acceso Rápido</h1>
          <p className="text-gray-400 text-sm mt-1">Ingresa tu correo para Continuar</p>
        </div>

        <form onSubmit={handleSmartSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Correo Electrónico</label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="ejemplo@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl py-3 px-4 font-mono pr-12 focus:ring-2 focus:ring-mipana-mediumBlue outline-none transition-all"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-mipana-mediumBlue transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Teléfono (WhatsApp)</label>
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="0412 123 4567"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-gray-50 dark:bg-gray-700 font-mono"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Nombre</label>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Tu Nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => {
                // ⚡ SMART PREFETCH: User is almost done
                if (isDriverDomain()) prefetchPage('DriverHome');
                else prefetchPage('PassengerHome');
                prefetchPage('Wallet');
              }}
              className="w-full bg-gray-50 dark:bg-gray-700"
              disabled={isLoading}
            />
          </div>
        </form>

        <Button
          type="submit"
          onClick={handleSmartSubmit}
          isLoading={isLoading}
          disabled={isLoading || !email || !password || !phone || !name}
          fullWidth
          variant="action"
          className="mt-8 h-14 text-lg shadow-mipana"
        >
          Continuar
        </Button>

        <button onClick={onNavigateLogin} className="w-full text-center mt-6 text-gray-400 hover:text-mipana-mediumBlue text-xs font-bold">
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default Register;