
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSmartSubmit = async () => {
    if (!email.includes('@')) {
      toast.error("Por favor ingresa un email válido");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (phone.length < 10) {
      toast.error("Ingresa un número de teléfono válido para WhatsApp");
      return;
    }

    setIsLoading(true);
    try {
      // Call Smart Service (Login or Signup)
      await authService.registerOrLoginImplicit(email.trim(), password, name, phone);

      // No need to manually call login() anymore, 
      // AuthContext's onAuthStateChange will handle the state update.
      toast.success("¡Acceso exitoso!");
      onNavigateHome();

    } catch (err: any) {
      console.error('Auth Error:', err);
      toast.error(err.message || "Error de autenticación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mipana-lightGray dark:bg-[#011836] flex flex-col items-center justify-center p-6">

      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <img src="/logo-app.png" alt="Mi Pana App" className="h-20 w-auto mx-auto mb-4 drop-shadow-xl" />
          <h1 className="text-2xl font-bold text-mipana-darkBlue dark:text-white">Acceso Rápido</h1>
          <p className="text-gray-400 text-sm mt-1">Ingresa tu correo para Continuar</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Correo Electrónico</label>
            <Input
              placeholder="ejemplo@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Contraseña</label>
            <Input
              type="password"
              placeholder="********"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 font-mono"
            />
          </div>

          {/* Phone Number Field - Critical for WhatsApp */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Teléfono (WhatsApp)</label>
            <Input
              type="tel"
              placeholder="0412 123 4567"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-gray-50 dark:bg-gray-700 font-mono"
            />
          </div>

          {/* Optional Name for new users */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Nombre (Opcional si eres nuevo)</label>
            <Input
              placeholder="Tu Nombre"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700"
            />
          </div>
        </div>

        <Button
          onClick={handleSmartSubmit}
          isLoading={isLoading}
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