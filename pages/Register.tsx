

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { ArrowLeft, Smartphone, Lock, User, CreditCard, AlertCircle, MessageCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useGoogleLogin } from '@react-oauth/google';
import Button from '../components/Button';
import Input from '../components/Input';
import Stepper from '../components/Stepper';
import OtpInput from '../components/OtpInput';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

// --- SCHEMAS (Zod Validation) ---
const emailSchema = z.string().email("Correo electrónico inválido");
const phoneSchema = z.string().regex(/^0(4|2)\d{9}$/, "Número válido requerido (Ej: 04121234567)");
const otpSchema = z.string().length(6, "El código debe tener 6 dígitos");
const passwordSchema = z.string().min(6, "La contraseña debe tener al menos 6 caracteres");
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
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idType, setIdType] = useState<'V' | 'E' | 'J'>('V');
  const [idNumber, setIdNumber] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- HANDLERS ---

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        // Pre-fill data with Google info
        setFirstName(userInfo.given_name);
        setLastName(userInfo.family_name);
        setEmail(userInfo.email);
        setIsGoogleUser(true);

        setCurrentStep(2);
        setError(null);
        toast.success("Conectado con Google exitosamente");
      } catch (e) {
        toast.error("Error conectando con Google");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error("Falló el registro con Google");
    }
  });

  const handleGoogleRegister = () => {
    googleLogin();
  };

  const checkEmailAvailability = async () => {
    const result = emailSchema.safeParse(email);
    if (result.success === false) {
      toast.error(result.error.errors[0].message);
      return false;
    }
    try {
      setIsLoading(true);
      const { exists } = await authService.checkEmail(email);
      if (exists) {
        toast.error("Este correo ya está registrado. Por favor inicia sesión.");
        return false;
      }
      return true;
    } catch (e) {
      toast.error("Error de conexión");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    setError(null);
    setIsGoogleUser(false);
    const isAvailable = await checkEmailAvailability();
    if (!isAvailable) return;

    setIsLoading(true);
    try {
      const response = await authService.sendOtp(email);
      if (!response.success) {
        toast.error(response.message || "No se pudo enviar el código.");
        return;
      }
      setCurrentStep(1);
      toast.success(`Código enviado a ${email}`);
    } catch (err) {
      toast.error("Error enviando código.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    setError(null);
    if (!otpSchema.safeParse(otp).success) {
      toast.error("Código inválido.");
      return;
    }

    setIsLoading(true);
    try {
      const { valid, message } = await authService.verifyOtp(email, otp);
      if (valid) {
        setCurrentStep(2);
        toast.success("Correo verificado");
      } else {
        toast.error(message || "Código incorrecto.");
      }
    } catch (err) {
      toast.error("Error verificando código.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    setError(null);
    const result = profileSchema.safeParse({ firstName, lastName, idNumber, age: Number(age), phone });
    if (result.success === false) {
      toast.error(result.error.errors[0].message);
      return;
    }

    // If user came from Google, skip password creation and finish registration
    if (isGoogleUser) {
      await handleFinalSubmit();
    } else {
      setCurrentStep(3);
    }
  };

  const handleFinalSubmit = async () => {
    setError(null);

    let finalPassword = password;

    // If manual registration, validate passwords
    if (!isGoogleUser) {
      if (password !== confirmPassword) {
        toast.error("Las contraseñas no coinciden.");
        return;
      }
      if (!passwordSchema.safeParse(password).success) {
        toast.error("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
    } else {
      // If Google user, generate a secure random password for the backend
      // Fallback for environments where crypto.randomUUID is not available
      finalPassword = window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
        password: finalPassword
      });

      login(UserRole.PASSENGER, user);
      toast.success("¡Cuenta creada exitosamente!");
      onNavigateHome();

    } catch (err: any) {
      toast.error(err.message || "Error creando cuenta.");
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
              icon={<Mail size={20} />}
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

            <OtpInput
              value={otp}
              onChange={setOtp}
              length={6}
              className="mb-4"
            />


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
              icon={<Smartphone size={18} />}
              type="tel"
              inputMode="numeric"
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
                icon={<CreditCard size={18} />}
                type="tel"
                inputMode="numeric"
              />
            </div>

            <Input
              label="Edad"
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="Ej: 25"
            />

            <Button onClick={handleProfileSubmit} fullWidth disabled={isLoading}>
              {isGoogleUser ? (isLoading ? 'Creando Cuenta...' : 'Finalizar Registro') : 'Siguiente'}
            </Button>
          </div>
        );

      case 3: // CONTRASEÑA
        return (
          <div className="space-y-6 animate-slide-left">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-mipana-darkBlue dark:text-white">Crea tu Contraseña</h2>
              <p className="text-gray-500 text-sm">Para proteger tu cuenta.</p>
            </div>

            <div className="space-y-4">
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />

              <Input
                label="Confirmar Contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
              />
            </div>

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
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          Al registrarte aceptas nuestros <a href="#" className="underline hover:text-mipana-mediumBlue">Términos de Servicio</a> y <a href="#" className="underline hover:text-mipana-mediumBlue">Política de Privacidad</a>.
        </div>
      </div>
    </div>
  );
};

export default Register;