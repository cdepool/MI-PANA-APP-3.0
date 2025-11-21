

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { ArrowLeft, Smartphone, Lock, User, CreditCard, AlertCircle, MessageCircle, Mail } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Stepper from '../components/Stepper';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

// --- SCHEMAS (Zod Validation) ---
const emailSchema = z.string().email("Correo electrónico inválido");
const phoneSchema = z.string().regex(/^0(4|2)\d{9}$/, "Número válido requerido (Ej: 04121234567)");
const otpSchema = z.string().length(6, "El código debe tener 6 dígitos");
const pinSchema = z.string().length(6, "El PIN debe tener 6 dígitos").regex(/^\d+$/, "Solo números");
const profileSchema = z.object({
  firstName: z.string().min(2, "Mínimo 2 letras"),
  lastName: z.string().min(2, "Mínimo 2 letras"),
  idNumber: z.string().min(6, "Cédula inválida").regex(/^\d+$/, "Solo números"),
  age: z.number().min(18, "Debes ser mayor de edad"),
  phone: phoneSchema
});

const STEPS = ['Correo', 'Código', 'Perfil', 'Seguridad'];

interface RegisterProps {
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigateHome, onNavigateLogin }) => {
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Phone is now part of profile, not verification
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idType, setIdType] = useState<'V' | 'E' | 'J'>('V');
  const [idNumber, setIdNumber] = useState('');
  const [age, setAge] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // --- HANDLERS ---

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    try {
      const gUser = await authService.simulateGoogleLogin();
      // Pre-fill data with Google info
      const names = gUser.name.split(' ');
      setFirstName(names[0]);
      setLastName(names.slice(1).join(' '));
      setEmail(gUser.email);
      
      // Skip email verification since it comes from Google
      setCurrentStep(2);
      setError(null);
    } catch (e) {
      setError("Error conectando con Google");
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailAvailability = async () => {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return false;
    }
    try {
      setIsLoading(true);
      const { exists } = await authService.checkEmail(email);
      if (exists) {
        setError("Este correo ya está registrado. Por favor inicia sesión.");
        return false;
      }
      return true;
    } catch (e) {
      setError("Error de conexión");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    setError(null);
    const isAvailable = await checkEmailAvailability();
    if (!isAvailable) return;

    setIsLoading(true);
    try {
      await authService.sendOtp(email);
      setCurrentStep(1);
    } catch (err) {
      setError("Error enviando código.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setError(null);
    if (!otpSchema.safeParse(otp).success) {
      setError("Código inválido.");
      return;
    }

    setIsLoading(true);
    try {
      const { valid, message } = await authService.verifyOtp(email, otp);
      if (valid) {
        setCurrentStep(2);
      } else {
        setError(message || "Código incorrecto.");
      }
    } catch (err) {
      setError("Error verificando código.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = () => {
    setError(null);
    const result = profileSchema.safeParse({ firstName, lastName, idNumber, age: Number(age), phone });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setCurrentStep(3);
  };

  const handleFinalSubmit = async () => {
    setError(null);
    if (pin !== confirmPin) {
      setError("Los PINs no coinciden.");
      return;
    }
    if (!pinSchema.safeParse(pin).success) {
      setError("El PIN debe ser de 6 dígitos numéricos.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await authService.registerUser({
        email,
        phone,
        firstName,
        lastName,
        idType,
        idNumber,
        age: Number(age),
        pin
      });
      
      // Auto-login and redirect
      login(UserRole.PASSENGER, user);
      onNavigateHome();

    } catch (err: any) {
      setError(err.message || "Error creando cuenta.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // EMAIL
        return (
          <div className="space-y-6 animate-slide-left">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-mipana-darkBlue dark:text-white">Crear Cuenta</h2>
              <p className="text-gray-500 text-sm">Usa tu correo electrónico para empezar.</p>
            </div>

            {/* Google Register Button */}
            <button 
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 p-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
              Continuar con Google
            </button>

            <div className="flex items-center gap-2 my-4">
               <div className="h-px bg-gray-200 flex-1"></div>
               <span className="text-xs text-gray-400">O usa tu correo</span>
               <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <Input 
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.nombre@gmail.com"
              icon={<Mail size={20}/>}
              className="text-lg"
              autoFocus
            />

            <Button onClick={handleSendCode} disabled={isLoading} fullWidth>
               {isLoading ? 'Enviando...' : 'Enviar Código al Correo'}
            </Button>
          </div>
        );

      case 1: // OTP
        return (
          <div className="space-y-6 animate-slide-left">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-mipana-darkBlue dark:text-white">Código de Verificación</h2>
              <p className="text-gray-500 text-sm">Enviado a {email}</p>
              <button className="text-xs text-mipana-mediumBlue font-bold underline" onClick={() => setCurrentStep(0)}>Cambiar correo</button>
            </div>
            <div className="flex justify-center">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-48 text-center text-3xl font-bold tracking-[0.5em] border-b-4 border-mipana-mediumBlue bg-transparent focus:outline-none dark:text-white py-2"
                autoFocus
                placeholder="000000"
              />
            </div>
            <p className="text-xs text-center text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded">
               ⚠️ Simulación Gmail: Revisa la alerta del navegador o usa <b>000000</b>
            </p>
            <Button onClick={handleOtpSubmit} fullWidth disabled={isLoading}>
              {isLoading ? 'Validando...' : 'Verificar Código'}
            </Button>
          </div>
        );

      case 2: // PROFILE
        return (
          <div className="space-y-4 animate-slide-left">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-mipana-darkBlue dark:text-white">Datos Personales</h2>
              <p className="text-gray-500 text-sm">Completa tu perfil de pasajero.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Pedro" />
              <Input label="Apellido" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Pérez" />
            </div>

            <Input 
              label="Móvil de Contacto"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="04121234567"
              icon={<Smartphone size={18}/>}
            />

            <div className="flex gap-2">
              <select 
                className="w-20 p-3 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white font-bold"
                value={idType}
                onChange={(e) => setIdType(e.target.value as any)}
              >
                <option value="V">V</option>
                <option value="E">E</option>
                <option value="J">J</option>
              </select>
              <Input 
                className="flex-1" 
                placeholder="Cédula de Identidad" 
                value={idNumber} 
                onChange={e => setIdNumber(e.target.value.replace(/[^0-9]/g, ''))}
                icon={<CreditCard size={18}/>}
              />
            </div>

            <Input 
              label="Edad" 
              type="number" 
              value={age} 
              onChange={e => setAge(e.target.value)} 
              placeholder="Ej: 25"
            />

            <Button onClick={handleProfileSubmit} fullWidth>
              Siguiente
            </Button>
          </div>
        );

      case 3: // PIN
        return (
          <div className="space-y-6 animate-slide-left">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-mipana-darkBlue dark:text-white">Crea tu PIN</h2>
              <p className="text-gray-500 text-sm">Para autorizar pagos y seguridad.</p>
            </div>
            
            <Input 
              label="PIN de 6 Dígitos"
              type="password" 
              maxLength={6}
              value={pin} 
              onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))} 
              icon={<Lock size={18}/>}
              placeholder="******"
              className="text-center tracking-widest text-lg"
            />

            <Input 
              label="Confirmar PIN"
              type="password" 
              maxLength={6}
              value={confirmPin} 
              onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))} 
              icon={<Lock size={18}/>}
              placeholder="******"
              className="text-center tracking-widest text-lg"
            />

            <Button onClick={handleFinalSubmit} fullWidth variant="action" disabled={isLoading}>
               {isLoading ? 'Creando Cuenta...' : 'Finalizar Registro'}
            </Button>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-mipana-lightGray dark:bg-[#011836] flex flex-col">
      {/* Navigation Header */}
      <div className="p-4 flex items-center">
        <button onClick={onNavigateLogin} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="text-mipana-darkBlue dark:text-white" />
        </button>
        <div className="ml-4">
           <h1 className="font-bold text-mipana-darkBlue dark:text-white">Registro de Pasajero</h1>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-6">
        <Stepper steps={STEPS} currentStep={currentStep} />

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
           {renderStepContent()}
           
           {error && (
             <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm animate-pulse">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
             </div>
           )}
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-400">
          Al registrarte aceptas nuestros <a href="#" className="underline hover:text-mipana-mediumBlue">Términos de Servicio</a> y <a href="#" className="underline hover:text-mipana-mediumBlue">Política de Privacidad</a>.
        </div>
      </div>
    </div>
  );
};

export default Register;