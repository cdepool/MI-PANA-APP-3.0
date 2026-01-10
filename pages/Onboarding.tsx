import React, { useState } from 'react';
import { ArrowLeft, MapPin, Navigation, Info, Shield, Check, ChevronRight, Smartphone, Lock, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { UserRole } from '../types';

// Step Enum
type OnboardingStep = 1 | 2 | 3;

const Onboarding = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    // State
    const [step, setStep] = useState<OnboardingStep>(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form Data
    const [phone, setPhone] = useState('');
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'temporary' | null>(null);
    const [name, setName] = useState(''); // Added Name as per plan
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // --- STEP 1: Phone Verification ---
    const handlePhoneSubmit = async () => {
        if (phone.length < 10) {
            toast.error("Por favor ingresa un número válido");
            return;
        }
        // Simulate OTP sent
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            toast.success("Código enviado y verificado automáticamente (Demo)");
            setStep(2);
        }, 1000);
    };

    // --- STEP 2: Location Permission ---
    const requestLocation = (type: 'always' | 'once' | 'never') => {
        if (type === 'never') {
            setLocationPermission('denied');
            toast.info("La app funcionará mejor con tu ubicación.");
            setStep(3);
            return;
        }

        toast.promise(
            new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => resolve(true),
                    () => resolve(false)
                );
            }),
            {
                loading: 'Solicitando permisos...',
                success: () => {
                    setLocationPermission('granted');
                    setStep(3);
                    return "¡Ubicación activada!";
                },
                error: "Permiso denegado. Puedes activarlo luego en ajustes."
            }
        );
    };

    // --- STEP 3: Profile & Registration ---
    const handleRegistration = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        setIsLoading(true);
        try {
            // Register using AuthService (Standard SignUp)
            // We use basic signUp here, handling errors gracefully

            // NOTE: Using a modified register flow or standard one. 
            // For now, assume standard Supabase SignUp + Profile creation via trigger or service

            // For demo/simulated backend as requested in prompt:
            await new Promise(r => setTimeout(r, 1500));

            // In a real scenario, we would call authService.registerUser()
            // Here we simulate success to match the requested flow

            /* 
            const user = await authService.registerUser({
               firstName: name.split(' ')[0],
               lastName: name.split(' ').slice(1).join(' ') || '',
               email,
               password,
               phone,
               idType: 'V', // Default
               idNumber: '00000000', // Default/Pending
            });
            */

            // Temporary Fake Login for UI Demo
            const fakeUser = {
                id: 'new-user-123',
                name: name,
                email: email,
                phone: phone,
                role: UserRole.PASSENGER
            };

            login(UserRole.PASSENGER, fakeUser as any);

            toast.success(`¡Bienvenido a Mi Pana, ${name.split(' ')[0]}!`);
            navigate('/passenger'); // Or home

        } catch (error: any) {
            toast.error(error.message || "Error al crear cuenta");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] flex flex-col items-center relative overflow-hidden text-[#1A2E56] dark:text-slate-100">

            {/* Header / Back Button (Visible on Step 2 & 3) */}
            {step > 1 && (
                <div className="absolute top-4 left-4 z-20">
                    <button onClick={() => setStep(prev => (prev - 1) as OnboardingStep)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
                        <ArrowLeft size={24} />
                    </button>
                </div>
            )}

            {/* --- STEP 1 UI --- */}
            {step === 1 && (
                <div className="w-full h-full flex flex-col">
                    {/* Hero Image */}
                    <div className="relative w-full h-[55vh] bg-[#1A2E56]">
                        {/* Using the generated image path here - placeholder for now, will replace with artifact link if tool succeeds */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-[#0F172A] z-10" />
                        <img
                            src="/onboarding_hero_car.png"
                            alt="Mi Pana App"
                            className="w-full h-full object-cover opacity-90"
                            onError={(e) => e.currentTarget.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070&auto=format&fit=crop'} // Fallback
                        />
                    </div>

                    <div className="flex-1 flex flex-col px-8 -mt-12 z-20">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold leading-tight mb-2 tracking-tight">
                                ¡A donde quieras ir, <span className="text-[#FF6B00]">Vamos!</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-lg">Tu transporte seguro y confiable en Venezuela.</p>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-semibold ml-1">Número de celular</label>
                            <div className="flex gap-3">
                                <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 flex items-center justify-center font-bold min-w-[80px]">
                                    🇻🇪 +58
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="412 000 0000"
                                        className="w-full h-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#FF6B00] transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handlePhoneSubmit}
                                disabled={isLoading || phone.length < 9}
                                className="w-full bg-[#1A2E56] dark:bg-white dark:text-[#1A2E56] text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-[#1A2E56]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isLoading ? "Verificando..." : "Verificar número"}
                            </button>

                            <p className="text-center text-sm text-slate-400 mt-4">
                                ¿Ya tienes cuenta?
                                <span onClick={() => navigate('/login')} className="text-[#FF6B00] font-bold ml-1 cursor-pointer">Inicia sesión</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STEP 2 UI --- */}
            {step === 2 && (
                <div className="w-full h-full flex flex-col p-8 pt-20 animate-fade-in">
                    <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-8 text-[#FF6B00]">
                            <MapPin size={40} fill="currentColor" />
                        </div>

                        <h2 className="text-3xl font-bold mb-4">Ubicación</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-xs mx-auto">
                            Para encontrarte el mejor conductor, necesitamos saber dónde estás.
                        </p>

                        {/* Visualization */}
                        <div className="grid grid-cols-2 gap-4 w-full mb-12">
                            <div className="flex flex-col items-center gap-2 opacity-50">
                                <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-transparent">
                                    <div className="w-16 h-16 bg-slate-300 rounded-full blur-xl" />
                                </div>
                                <span className="text-sm font-medium">Aproximada</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-full aspect-square bg-[#FF6B00]/5 dark:bg-[#FF6B00]/10 rounded-2xl flex items-center justify-center border-2 border-[#FF6B00] shadow-xl shadow-[#FF6B00]/10 relative overflow-hidden">
                                    <MapPin className="text-[#FF6B00] z-10" size={32} fill="currentColor" />
                                    <div className="absolute inset-0 mesh-gradient opacity-20" />
                                </div>
                                <span className="text-sm font-bold text-[#FF6B00]">Precisa</span>
                            </div>
                        </div>

                        <div className="w-full space-y-3 mt-auto">
                            <button
                                onClick={() => requestLocation('always')}
                                className="w-full bg-[#1A2E56] dark:bg-white dark:text-[#1A2E56] text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-[0.98] transition-all"
                            >
                                Mientras se usa la app
                            </button>
                            <button
                                onClick={() => requestLocation('once')}
                                className="w-full bg-transparent border border-slate-200 dark:border-slate-700 font-bold py-4 rounded-xl text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Solo esta vez
                            </button>
                            <button
                                onClick={() => requestLocation('never')}
                                className="w-full py-2 text-slate-400 font-medium text-sm"
                            >
                                No permitir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STEP 3 UI --- */}
            {step === 3 && (
                <div className="w-full h-full flex flex-col p-8 pt-20 animate-fade-in">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold mb-2">
                            ¡Hola{name ? `, ${name.split(' ')[0]}` : ''}! 👋
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">Termina de crear tu perfil.</p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="text-sm font-semibold ml-1 mb-1 block">Nombre completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-4 text-slate-400" size={20} />
                                <Input
                                    className="pl-12"
                                    placeholder="María Pérez"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold ml-1 mb-1 block">Correo electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
                                <Input
                                    className="pl-12"
                                    type="email"
                                    placeholder="maria@correo.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold ml-1 mb-1 block">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                                <Input
                                    className="pl-12"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleRegistration}
                                disabled={isLoading}
                                className="w-full bg-[#1A2E56] dark:bg-white dark:text-[#1A2E56] text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                                {!isLoading && <ChevronRight size={20} />}
                            </button>
                        </div>

                        <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
                            Al registrarte, aceptas nuestros <br /> Términos de Servicio y Política de Privacidad.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Onboarding;
