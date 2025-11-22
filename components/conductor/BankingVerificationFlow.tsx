import React, { useState } from 'react';
import { ShieldCheck, Smartphone, Lock, ArrowRight, Check } from 'lucide-react';

interface BankingVerificationFlowProps {
    onComplete: (data: any) => void;
    onCancel: () => void;
}

export const BankingVerificationFlow: React.FC<BankingVerificationFlowProps> = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        accountNumber: '',
        pagoMovilPhone: '',
        pagoMovilId: ''
    });
    const [otp, setOtp] = useState('');

    const handleNext = () => {
        if (step === 1) {
            // Simulate sending OTP
            alert(`[SIMULACIÓN] Tu código de seguridad es: 123456`);
            setStep(2);
        } else if (step === 2) {
            if (otp === '123456') {
                onComplete(formData);
            } else {
                alert('Código incorrecto');
            }
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-6">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>1</div>
                <div className="w-12 h-1 bg-gray-300 mx-2">
                    <div className={`h-full bg-blue-600 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>2</div>
            </div>

            {step === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-blue-600" />
                        Datos Bancarios (Bancamiga)
                    </h4>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Número de Cuenta (20 dígitos)</label>
                        <input
                            type="text"
                            maxLength={20}
                            value={formData.accountNumber}
                            onChange={e => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                            className="w-full p-3 border rounded-lg font-mono text-lg tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0172..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Teléfono Pago Móvil</label>
                            <input
                                type="text"
                                value={formData.pagoMovilPhone}
                                onChange={e => setFormData({ ...formData, pagoMovilPhone: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0414..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Cédula Titular</label>
                            <input
                                type="text"
                                value={formData.pagoMovilId}
                                onChange={e => setFormData({ ...formData, pagoMovilId: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="V-..."
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleNext}
                        disabled={formData.accountNumber.length !== 20}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        Continuar <ArrowRight size={18} />
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="text-center mb-4">
                        <Smartphone size={48} className="mx-auto text-blue-600 mb-2" />
                        <h4 className="font-bold text-gray-800">Verificación de Seguridad</h4>
                        <p className="text-sm text-gray-500">Hemos enviado un código SMS a tu número registrado.</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase text-center block mb-2">Código de Verificación</label>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            className="w-full p-4 border-2 border-blue-100 rounded-xl font-mono text-3xl text-center tracking-[1em] focus:border-blue-500 focus:ring-0 outline-none"
                            placeholder="000000"
                        />
                    </div>

                    <button
                        onClick={handleNext}
                        className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                        <Lock size={18} /> Verificar y Guardar
                    </button>

                    <button onClick={() => setStep(1)} className="w-full text-sm text-gray-500 hover:text-gray-800">
                        Volver atrás
                    </button>
                </div>
            )}
        </div>
    );
};
