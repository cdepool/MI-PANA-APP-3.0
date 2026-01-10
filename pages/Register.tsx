
import React, { useState } from 'react';
import { z } from 'zod'; // Keep zod for basic validation if needed, or simple checks
import { ArrowLeft, Smartphone, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../components/Button';
import Input from '../components/Input';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface RegisterProps {
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigateHome, onNavigateLogin }) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const handleImplicitSubmit = async () => {
    // Basic Validation
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Por favor completa tu nombre y apellido");
      return;
    }
    if (phone.length < 10) {
      toast.error("Número de teléfono inválido");
      return;
    }

    setIsLoading(true);
    const fullName = `${firstName} ${lastName}`.trim();

    try {
      // Call the new Implicit Auth Service
      const user = await authService.registerOrLoginImplicit(fullName, phone);

      // Update Context & Navigate
      login(UserRole.PASSENGER, user);
      toast.success(`¡Bienvenido, ${firstName}!`);
      onNavigateHome();

    } catch (err: any) {
      console.error('Implicit Auth Error:', err);
      toast.error("Hubo un problema al ingresar. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mipana-lightGray dark:bg-[#011836] flex flex-col">
      {/* Header Simplified */}
      <div className="p-4 flex items-center">
        <button onClick={onNavigateLogin} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="text-mipana-darkBlue dark:text-white" />
        </button>
        <div className="ml-4">
          <h1 className="font-bold text-mipana-darkBlue dark:text-white text-lg">Ingreso Rápido</h1>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-6 flex flex-col justify-center">

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-6">

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-mipana-darkBlue dark:text-white mb-2">¡Hola Pana! 👋</h2>
            <p className="text-gray-500 text-sm">Ingresa tu nombre y teléfono para comenzar.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <Input
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Carlos"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
                <Input
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Depool"
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono Móvil</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3 text-gray-400" size={20} />
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0412 123 4567"
                  className="pl-10 w-full font-mono text-lg"
                  type="tel"
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 pl-1">Sin códigos, sin espera.</p>
            </div>
          </div>

          <Button
            onClick={handleImplicitSubmit}
            fullWidth
            disabled={isLoading}
            variant="action"
            className="mt-4 h-12 text-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" /> Ingresando...
              </div>
            ) : 'Entrar'}
          </Button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Al entrar aceptas nuestros <a href="#" className="underline text-mipana-mediumBlue">Términos de Servicio</a>.
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;