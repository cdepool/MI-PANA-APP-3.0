
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, AppView } from '../types';
import Button from '../components/Button';
import { Car, User, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginProps {
  onNavigateRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateRegister }) => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-mipana-darkBlue to-black">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center mb-6 shadow-md p-3">
             {/* Logo Icon */}
             <img 
               src="https://storage.googleapis.com/msgsndr/u0yeLpwH9qH0cMOrw2KP/media/68f4c7a98a42bd7e9f0909b7.png" 
               alt="Mi Pana Icon" 
               className="w-full h-full object-contain"
             />
          </div>
          <h1 className="text-3xl font-bold text-mipana-darkBlue dark:text-white mb-1">MI PANA APP</h1>
          <p className="text-mipana-mediumBlue text-sm tracking-widest font-medium mb-8">SIEMPRE CONECTADO</p>
          
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Selecciona tu perfil para ingresar
          </p>

          <div className="space-y-3">
            <Button 
              fullWidth 
              variant="primary" 
              onClick={() => login(UserRole.PASSENGER)}
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
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
             <p className="text-sm text-gray-500 mb-3">¿No tienes cuenta?</p>
             <button 
               onClick={onNavigateRegister}
               className="text-mipana-mediumBlue font-bold hover:underline flex items-center justify-center gap-1 w-full"
             >
                Crear Cuenta Nueva <ArrowRight size={16} />
             </button>
          </div>
          
          <div className="mt-6 text-xs text-gray-400">
            &copy; 2025 Mi Pana App. Acarigua - Araure.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;