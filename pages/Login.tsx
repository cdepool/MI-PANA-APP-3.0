
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import { Car, User, ShieldCheck, ArrowRight, ArrowLeft, Lock, Smartphone, AlertCircle } from 'lucide-react';

interface LoginProps {
  onNavigateRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateRegister }) => {
  const { login, loginPassenger } = useAuth();
  const [view, setView] = useState<'ROLE_SELECT' | 'PASSENGER_LOGIN'>('ROLE_SELECT');
  
  // Passenger Login State
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePassengerLogin = async () => {
    if (!phone || !pin) {
      setError('Ingresa tu teléfono y PIN.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await loginPassenger(phone, pin);
      // Navigation handled by App.tsx on user state change
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRoleSelection = () => (
    <div className="space-y-3 animate-fade-in">
      <Button 
        fullWidth 
        variant="primary" 
        onClick={() => setView('PASSENGER_LOGIN')}
        icon={<User size={18} />}
      >
        Soy Pasajero
      </Button>
      
      <Button 
        fullWidth 
        variant="outline" 
        onClick={() => login(UserRole.DRIVER)}
        icon={<Car size={18} />}
      >
        Soy Conductor (Pana)
      </Button>

      <Button 
        fullWidth 
        variant="secondary"
        className="opacity-70 hover:opacity-100" 
        onClick={() => login(UserRole.ADMIN)}
        icon={<ShieldCheck size={18} />}
      >
        Administrador
      </Button>

      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
         <p className="text-sm text-gray-500 mb-3">¿No tienes cuenta?</p>
         <button 
           onClick={onNavigateRegister}
           className="text-mipana-mediumBlue font-bold hover:underline flex items-center justify-center gap-1 w-full"
         >
            Crear Cuenta Nueva <ArrowRight size={16} />
         </button>
      </div>
    </div>
  );

  const renderPassengerForm = () => (
    <div className="space-y-4 animate-slide-left">
      <div className="text-left mb-4">
        <button onClick={() => setView('ROLE_SELECT')} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm mb-4">
          <ArrowLeft size={14} /> Volver
        </button>
        <h2 className="text-xl font-bold text-mipana-darkBlue dark:text-white">Bienvenido Pasajero</h2>
      </div>

      <Input 
        label="Teléfono Móvil"
        placeholder="0412 0000000"
        icon={<Smartphone size={18}/>}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <Input 
        label="PIN de Seguridad"
        type="password"
        placeholder="******"
        maxLength={6}
        icon={<Lock size={18}/>}
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />

      {error && (
         <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs">
            <AlertCircle size={14} /> {error}
         </div>
      )}

      <Button fullWidth onClick={handlePassengerLogin} disabled={isLoading}>
         {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
      </Button>

      <div className="text-center mt-4">
        <button className="text-xs text-gray-400 hover:text-mipana-mediumBlue">¿Olvidaste tu PIN?</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-mipana-darkBlue to-black">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center mb-6 shadow-md p-3">
             <img 
               src="https://storage.googleapis.com/msgsndr/u0yeLpwH9qH0cMOrw2KP/media/68f4c7a98a42bd7e9f0909b7.png" 
               alt="Mi Pana Icon" 
               className="w-full h-full object-contain"
             />
          </div>
          <h1 className="text-3xl font-bold text-mipana-darkBlue dark:text-white mb-1">MI PANA APP</h1>
          <p className="text-mipana-mediumBlue text-sm tracking-widest font-medium mb-8">SIEMPRE CONECTADO</p>
          
          {view === 'ROLE_SELECT' && (
             <p className="text-gray-500 dark:text-gray-400 mb-6">
               Selecciona tu perfil para ingresar
             </p>
          )}

          {view === 'ROLE_SELECT' ? renderRoleSelection() : renderPassengerForm()}
          
          <div className="mt-6 text-xs text-gray-400">
            &copy; 2025 Mi Pana App. Acarigua - Araure.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
