import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { walletService } from '../services/walletService';
import { Loader2, Smartphone, DollarSign, ArrowRight, ChevronDown, ChevronRight, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WalletRechargeProps {
  onBack: () => void;
  onSuccess: () => void;
}

// Bancos soportados
const BANKS = [
  "Bancamiga",
  "Banco de Venezuela",
  "Banesco",
  "BBVA Provincial",
  "Mercantil",
  "BNC",
  "Bicentenaria",
  "Tesoro",
  "Banplus",
  "Plaza",
  "Caroni",
  "Dyceven",
  "100% Banco",
  "Del Sur",
  "Exterior",
  "Venezolano de Crédito",
  "Bancaribe",
  "Mi Banco",
  "Bangente",
  "Bancrecer"
].sort();

// Tasa de cambio (Hardcoded por ahora para el ejemplo, idealmente vendría de API)
const EXCHANGE_RATE = 64.00; // Ejemplo: 64 Bs/$

export default function WalletRecharge({ onBack, onSuccess }: WalletRechargeProps) {
  const { user } = useAuth();

  // Estados del Wizard
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Método, 2: Monto, 3: Validación, 4: Procesando/Resultado

  // Datos del Formulario
  const [amountUSD, setAmountUSD] = useState<string>('');
  const [amountBS, setAmountBS] = useState<string>('');
  const [reference, setReference] = useState('');
  const [originBank, setOriginBank] = useState('');
  const [originPhone, setOriginPhone] = useState(user?.phone || '');
  const [showOriginPhoneInput, setShowOriginPhoneInput] = useState(false);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar montos
  const handleUSDChange = (val: string) => {
    setAmountUSD(val);
    if (!val) {
      setAmountBS('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmountBS((num * EXCHANGE_RATE).toFixed(2));
    }
  };

  const handleBSChange = (val: string) => {
    setAmountBS(val);
    if (!val) {
      setAmountUSD('');
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmountUSD((num / EXCHANGE_RATE).toFixed(2));
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const validatePayment = async () => {
    if (!reference || reference.length !== 4) {
      toast.error('La referencia debe ser los últimos 4 dígitos');
      return;
    }
    if (!originBank) {
      toast.error('Selecciona el banco de origen');
      return;
    }
    // Si el usuario activó el input manual, validar ese campo. Si no, usar el del perfil (o string vacío si no tiene)
    const phoneToSend = showOriginPhoneInput ? originPhone : (user?.phone || '');

    if (!phoneToSend) {
      // Si no hay teléfono en perfil ni manual, obligar a poner uno
      if (!showOriginPhoneInput) {
        setShowOriginPhoneInput(true);
        toast.error('Por favor indica el teléfono de origen');
        return;
      }
      toast.error('Indica el teléfono desde el cual se hizo el pago');
      return;
    }

    if (!walletService) {
      try {
        console.error('WalletService not initialized');
        toast.error('Error interno del servicio de billetera. Por favor recarga la página.');
        return;
      } catch (e) {
        console.error('Error checking walletService', e);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('Usuario no identificado');
      }

      // Validar monto mínimo
      const amountNum = parseFloat(amountBS);
      if (amountNum < 1) { // Mínimo 1 Bs (ajustable)
        throw new Error('El monto mínimo es 1 Bs');
      }

      console.log('Iniciando validación:', {
        amount: amountNum,
        bank: originBank,
        ref: reference,
        phone: phoneToSend
      });

      const result = await walletService.rechargeWallet(
        user.id,
        user.phone || '', // Teléfono del perfil (para notificaciones)
        amountNum,
        originBank,
        reference,
        phoneToSend // Teléfono real del pago
      );

      if (result.success) {
        toast.success('¡Recarga exitosa!');
        onSuccess();
      } else {
        setError(result.error || 'No se pudo verificar el pago');
      }

    } catch (err: any) {
      console.error('Error en recarga:', err);
      setError(err.message || 'Error al procesar la recarga');
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERIZADO ---

  // Header Común
  const Header = ({ title, showBack = true }: { title: string, showBack?: boolean }) => (
    <div className="flex items-center gap-4 mb-6">
      {showBack && (
        <button onClick={() => step === 1 ? onBack() : setStep(prev => (prev - 1) as any)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
          <ChevronDown className="w-6 h-6 rotate-90" />
        </button>
      )}
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );

  // PASO 1: SELECCIÓN DE MÉTODO
  if (step === 1) {
    return (
      <div className="p-4">
        <Header title="Recargar billetera" />

        <div className="relative overflow-hidden mb-6">
          <div className="bg-black text-white p-6 rounded-3xl mb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Saldo disponible</p>
                <h3 className="text-4xl font-bold tracking-tight">
                  $ {user?.wallet_balance_usd?.toFixed(2) || '0.00'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl shadow-lg">
                $
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4 text-gray-800">Métodos disponibles</h3>

        <button
          onClick={() => setStep(2)}
          className="w-full bg-white border border-gray-100 shadow-sm p-4 rounded-2xl flex items-center gap-4 hover:shadow-md transition-shadow group"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-gray-200 transition-colors">
            📱
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-bold text-gray-900">Pago Móvil</h4>
            <p className="text-sm text-gray-500">Acreditación inmediata</p>
          </div>
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
        </button>
      </div>
    );
  }

  // PASO 2: MONTO
  if (step === 2) {
    return (
      <div className="p-4 h-full flex flex-col">
        <Header title="Pago Móvil 📱" />

        <div className="bg-lime-200 p-4 rounded-2xl mb-8 flex items-center justify-center">
          <span className="font-bold text-xl text-lime-900">
            {amountBS ? `${amountBS} Bs` : '0,00 Bs'}
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 flex-1">
          <h3 className="text-center font-medium text-gray-800 mb-6 px-4">
            Ingrese el monto que desea recargar en su billetera
          </h3>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="number"
                value={amountUSD}
                onChange={(e) => handleUSDChange(e.target.value)}
                placeholder="0.00"
                className="w-full text-center text-2xl font-bold p-4 border rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            </div>

            <div className="relative">
              <input
                type="number"
                value={amountBS}
                onChange={(e) => handleBSChange(e.target.value)}
                placeholder="0.00"
                className="w-full text-center text-2xl font-bold p-4 border bg-gray-50 rounded-2xl focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Bs</span>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => {
                if (!amountBS || parseFloat(amountBS) <= 0) {
                  toast.error('Ingrese un monto válido');
                  return;
                }
                setStep(3);
              }}
              className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-900 transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>

        <div className="mb-4 bg-gray-100 p-4 rounded-xl">
          <h4 className="font-bold text-gray-700 text-xs uppercase mb-2">Realiza el pago móvil a:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Teléfono</span>
              <div className="flex items-center gap-2 font-medium">
                04145274111 <Copy className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => handleCopy('04145274111', 'Teléfono')} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">RIF</span>
              <div className="flex items-center gap-2 font-medium">
                J-407242741 <Copy className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => handleCopy('J407242741', 'RIF')} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Banco</span>
              <div className="flex items-center gap-2 font-medium">
                Bancamiga (0172)
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PASO 3: VALIDACIÓN
  if (step === 3) {
    return (
      <div className="p-4 h-full flex flex-col">
        <Header title="Pago Móvil 📱" />

        <div className="bg-lime-400 p-4 rounded-full mb-6 mx-auto w-3/4 flex items-center justify-center shadow-sm">
          <span className="font-black text-xl text-black">
            {amountBS} Bs
          </span>
        </div>

        <div className="bg-gray-200 rounded-3xl p-6 mb-6">
          <h3 className="text-center font-bold text-gray-700 text-sm uppercase mb-4 px-8 leading-tight">
            Coloque los datos del pago móvil realizado
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Últimos 4 dígitos de referencia</label>
              <input
                type="text"
                maxLength={4}
                value={reference}
                onChange={(e) => setReference(e.target.value.replace(/\D/g, ''))}
                placeholder="Ingrese referencia"
                className="w-full text-lg p-3 rounded-2xl border-none focus:ring-2 focus:ring-black outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Banco</label>
              <select
                value={originBank}
                onChange={(e) => setOriginBank(e.target.value)}
                className="w-full text-lg p-3 rounded-2xl border-none focus:ring-2 focus:ring-black outline-none bg-white text-gray-700 appearance-none"
              >
                <option value="">Seleccione el banco</option>
                {BANKS.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            {/* Toggle para Teléfono de Origen */}
            <div>
              {!showOriginPhoneInput ? (
                <button
                  onClick={() => {
                    setShowOriginPhoneInput(true);
                    // Prellenar con perfil al abrir
                    if (!originPhone && user?.phone) {
                      setOriginPhone(user.phone);
                    }
                  }}
                  className="text-blue-600 text-xs font-medium hover:underline ml-1 flex items-center gap-1"
                >
                  ¿Pagaste desde otro número?
                </button>
              ) : (
                <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1 ml-1">Teléfono de Origen</label>
                  <input
                    type="tel"
                    value={originPhone}
                    onChange={(e) => setOriginPhone(e.target.value)}
                    placeholder="0414..."
                    className="w-full text-lg p-3 rounded-2xl border-none focus:ring-2 focus:ring-black outline-none bg-white"
                  />
                  <button
                    onClick={() => {
                      setShowOriginPhoneInput(false);
                      // Restaurar al perfil si cancela
                      if (user?.phone) setOriginPhone(user.phone);
                    }}
                    className="text-red-500 text-xs ml-1 mt-1 hover:underline"
                  >
                    Cancelar y usar mi número registro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Datos de Pago (Repetido para referencia rápida) */}
        <div className="mb-6 px-4">
          <h4 className="font-bold text-gray-800 text-xs uppercase mb-3 text-center">Realiza el pago móvil a:</h4>
          <div className="space-y-2 text-sm font-medium text-gray-800">
            <div className="flex justify-between items-center">
              <span>Número de teléfono</span>
              <div className="flex items-center gap-2">
                04145274111 <Copy className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => handleCopy('04145274111', 'Teléfono')} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>RIF</span>
              <div className="flex items-center gap-2">
                J-407242741 <Copy className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => handleCopy('J407242741', 'RIF')} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Banco</span>
              <span>Bancamiga</span>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={validatePayment}
            disabled={isLoading}
            className="w-full bg-black text-white py-4 rounded-3xl font-bold text-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Validando...
              </>
            ) : (
              'Validar pago'
            )}
          </button>
        </div>

      </div>
    );
  }

  return null;
}
