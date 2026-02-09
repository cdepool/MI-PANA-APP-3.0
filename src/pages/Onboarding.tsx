import React, { useState, useEffect } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { UserRole } from '../types';

const welcomeBg = '/welcome_bg.jpg';
const onboardingSkin = '/onboarding_skin.jpg';

// Step Enum
type OnboardingStep = 1 | 2 | 3; // 1: Welcome (Google), 2: Phone Collection, 3: Location

const Onboarding = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState<OnboardingStep>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Initial Auth Check
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                handleAuthenticatedUser(session.user);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                handleAuthenticatedUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleAuthenticatedUser = async (user: any) => {
        setCurrentUser(user);
        // Check if user has phone in profile
        try {
            const { data: profile } = await authService.getProfile(user.id);

            if (profile && profile.phone) {
                // User has phone, go to Home immediately (or location check)
                // Assuming Location is just a permission preference, we can skip to home if already done too.
                // For this flow, let's just go to Home if phone exists.
                navigate('/passenger');
            } else {
                // User needs to input phone
                setStep(2);
            }
        } catch (e) {
            console.error("Profile check failed", e);
            // Fallback: Ask for phone
            setStep(2);
        }
    };

    // --- Actions ---

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const { error } = await authService.signInWithGoogle();
            if (error) throw error;
            // Redirect happens here
        } catch (error: any) {
            toast.error(error.message || "Error con Google");
            setIsLoading(false);
        }
    };

    const handlePhoneSave = async () => {
        if (phone.length < 10) {
            toast.error("Número inválido");
            return;
        }
        if (!currentUser) return;

        setIsLoading(true);
        try {
            await authService.updateUserProfilePhone(currentUser.id, phone);
            toast.success("¡Datos guardados!");
            setStep(3); // Go to Location
        } catch (error: any) {
            toast.error("Error guardando teléfono: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLocationPermission = (type: 'always' | 'once' | 'never') => {
        if (type === 'never') {
            navigate('/passenger');
            return;
        }

        toast.promise(
            new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(resolve, resolve);
            }),
            {
                loading: 'Solicitando...',
                success: () => {
                    navigate('/passenger');
                    return "¡Listo!";
                },
                error: () => {
                    navigate('/passenger'); // Proceed anyway
                    return "Continuando...";
                }
            }
        );
    };


    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] flex flex-col items-center relative overflow-hidden text-[#1A2E56] dark:text-slate-100">

            {/* --- STEP 1: Welcome & Google Auth --- */}
            {step === 1 && (
                <div className="w-full h-screen relative flex flex-col items-center justify-between overflow-hidden font-inter">
                    {/* Background */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src="/welcome_bg.png"
                            alt="Background"
                            className="w-full h-full object-fill"
                        />
                    </div>

                    {/* Top Section: Mascot & Logo */}
                    <div className="relative z-10 w-full h-[45%]">
                        {/* Logo Top Right */}
                        <div className="absolute top-[8%] right-[8%] w-[40%] max-w-[180px] animate-fade-in-down">
                            <img
                                src="/logo_full.png"
                                alt="Mi Pana Logo"
                                className="w-full h-auto drop-shadow-2xl"
                            />
                        </div>

                        {/* Mascot Top Left */}
                        <div className="absolute top-[12%] left-[-5%] w-[55%] max-w-[240px] animate-slide-in-left">
                            <img
                                src="/parrot_mascot.png"
                                alt="Parrot"
                                className="w-full h-auto drop-shadow-2xl"
                                style={{ transform: 'rotate(5deg)' }}
                            />
                        </div>
                    </div>

                    {/* Middle Section: Title (Re-added) */}
                    <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-6 text-center -mt-10">
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] drop-shadow-lg tracking-tight mb-2 uppercase italic" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                            ¡A donde quieras ir,<br />
                            Mi Pana!
                        </h1>
                    </div>

                    {/* Bottom Section: Text & Button */}
                    <div className="relative z-10 w-full flex flex-col items-center pb-10 px-6 text-center">
                        <p className="text-[#1A2E56] font-bold text-xl mb-4 tracking-wide">
                            Iniciar sesión
                        </p>

                        {/* Login Button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full max-w-sm bg-white hover:bg-gray-50 text-slate-800 font-bold py-4 rounded-full text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-12"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="G" />
                            Continuar con Google
                        </button>

                        {/* Footer */}
                        <p className="text-[10px] text-[#1A2E56] font-bold tracking-widest uppercase opacity-80">
                            Next TV, C.A Todos los derechos reservados
                        </p>
                    </div>
                </div>
            )}

            {/* --- STEP 2: Phone Collection (Missing Data) --- */}
            {step === 2 && (
                <div className="w-full h-full flex flex-col relative animate-fade-in">
                    {/* Background Skin */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src="/onboarding_skin.png"
                            alt="Background"
                            className="w-full h-full object-cover"
                        />
                        {/* Light Overlay for general brightness/contrast if needed, or keeping it clean */}
                        {/* Removing dark gradient as requested for cleaner look, maybe a very subtle light wash at bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-white/40 via-white/10 to-transparent" />
                    </div>

                    {/* Content (Bottom Sheet Style) */}
                    <div className="relative z-10 flex-1 flex flex-col justify-end p-8 pb-12">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold mb-2 text-[#1A2E56]">Un último paso...</h2>
                            <p className="text-[#1A2E56]/80 text-lg font-medium">
                                Necesitamos tu número para coordinar los viajes.
                            </p>
                        </div>

                        <div className="space-y-4 w-full bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 shadow-xl">
                            <div>
                                <label className="text-sm font-bold ml-1 mb-2 block text-[#1A2E56]">Número de celular</label>
                                <div className="flex gap-3">
                                    <div className="bg-white/80 border border-white/50 rounded-xl px-4 py-4 flex items-center justify-center font-bold min-w-[80px] text-[#1A2E56]">
                                        🇻🇪 +58
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="412 000 0000"
                                        className="flex-1 bg-white/80 border border-white/50 rounded-xl px-4 text-lg font-medium outline-none focus:ring-4 focus:ring-[#FF6B00]/30 transition-all text-[#1A2E56] placeholder:text-gray-500"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handlePhoneSave}
                                disabled={isLoading || phone.length < 9}
                                className="w-full bg-[#1A2E56] hover:bg-[#0F172A] text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {isLoading ? "Guardando..." : "Guardar y Continuar"}
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STEP 3: Location Permissions --- */}
            {step === 3 && (
                <div className="w-full h-full flex flex-col p-8 pt-20 animate-fade-in max-w-md mx-auto">
                    <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-8 text-[#FF6B00]">
                            <MapPin size={40} fill="currentColor" />
                        </div>

                        <h2 className="text-3xl font-bold mb-4">Ubicación</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">
                            Para encontrarte el mejor conductor, necesitamos saber dónde estás.
                        </p>

                        <div className="grid grid-cols-2 gap-4 w-full mb-8">
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
                                onClick={() => handleLocationPermission('always')}
                                className="w-full bg-[#1A2E56] dark:bg-white dark:text-[#1A2E56] text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-[0.98] transition-all"
                            >
                                Mientras se usa la app
                            </button>
                            <button
                                onClick={() => handleLocationPermission('once')}
                                className="w-full bg-transparent border border-slate-200 dark:border-slate-700 font-bold py-4 rounded-xl text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                Solo esta vez
                            </button>
                            <button
                                onClick={() => handleLocationPermission('never')}
                                className="w-full py-2 text-slate-400 font-medium text-sm"
                            >
                                No permitir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Onboarding;
